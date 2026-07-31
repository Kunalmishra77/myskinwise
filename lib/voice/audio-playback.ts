/**
 * Reliable voice playback for the assistant's spoken replies.
 *
 * The naive approach — `new Audio(dataUrl).play()` after the fetch resolves —
 * works on desktop Chrome and fails on mobile, because by the time the STT +
 * LLM + TTS round-trip returns (several seconds), the user-gesture window that
 * mobile browsers require for audio has long expired and play() is rejected.
 * That is precisely why the reply "didn't talk back".
 *
 * The fix, a well-proven pattern: unlock a single AudioContext on the first
 * user gesture (create it, resume it, play one silent sample), then play every
 * clip through that already-unlocked context with the Web Audio API. A resumed
 * AudioContext stays usable for the whole session, so playback no longer
 * depends on a recent tap.
 *
 * decodeAudioData + an AudioBufferSourceNode also start from sample zero with
 * no warm-up, and a short silent lead absorbs any dropped warm-up samples so
 * the first word is never clipped. HTMLAudio is the fallback for the rare
 * browser without Web Audio.
 */

let ctx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentAudio: HTMLAudioElement | null = null;
// An analyser sits on the playback path while a Web Audio clip is playing, so
// the voice avatar can pulse in time with Riya's actual speech amplitude.
let playbackAnalyser: AnalyserNode | null = null;
let playbackData: Float32Array<ArrayBuffer> | null = null;

/**
 * Current playback loudness, 0..1, or 0 when nothing is playing (or on the
 * HTMLAudio fallback path, which exposes no analyser). Cheap to poll per frame.
 */
export function playbackLevel(): number {
  if (!playbackAnalyser || !playbackData) return 0;
  playbackAnalyser.getFloatTimeDomainData(playbackData);
  let sum = 0;
  for (let i = 0; i < playbackData.length; i++) sum += playbackData[i]! * playbackData[i]!;
  const rms = Math.sqrt(sum / playbackData.length);
  // Speech RMS rarely exceeds ~0.3; normalise into a lively 0..1 range.
  return Math.min(1, rms * 3.2);
}
// Monotonic token: a newer play() or stop() invalidates any in-flight decode,
// so two clips can never overlap (e.g. an interrupted turn).
let seq = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Warm up the audio engine on a user gesture. Idempotent. Call it from the tap
 * that starts a conversation; the module also auto-registers a one-time global
 * listener so ordinary taps elsewhere prime it too.
 */
export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => {});
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  const handler = () => unlockAudio();
  // `once` is not enough — the first gesture may fail to fully resume on some
  // browsers, so keep priming until a later gesture succeeds; cheap and safe.
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("touchstart", handler, { passive: true });
  window.addEventListener("keydown", handler);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Stops any current playback and invalidates in-flight decodes. */
export function cancelPlayback(): void {
  seq++;
  if (currentSource) {
    currentSource.onended = null;
    try {
      currentSource.stop();
    } catch {
      /* already stopped */
    }
    try {
      currentSource.disconnect();
    } catch {
      /* ignore */
    }
    currentSource = null;
  }
  playbackAnalyser = null;
  playbackData = null;
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
}

/**
 * Plays a base64 MP3 clip. `onEnd` fires exactly once when it finishes or
 * fails, so the caller can advance the conversation (e.g. re-open the mic).
 */
export async function playClip(base64: string, onEnd?: () => void): Promise<void> {
  cancelPlayback();
  const mine = ++seq;
  let settled = false;
  const finish = () => {
    if (!settled) {
      settled = true;
      onEnd?.();
    }
  };

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(base64);
  } catch {
    finish();
    return;
  }

  const c = getCtx();
  if (c) {
    try {
      if (c.state === "suspended") await c.resume();
      // decodeAudioData wants its own ArrayBuffer; slice to detach.
      const decoded = await c.decodeAudioData(bytes.slice().buffer);
      if (mine !== seq) return;

      // ~200ms silent lead so a dropped warm-up quantum never clips the first
      // word — the silence absorbs it, the speech always plays in full.
      const padSec = 0.2;
      const pad = Math.floor(decoded.sampleRate * padSec);
      const buffer = c.createBuffer(decoded.numberOfChannels, decoded.length + pad, decoded.sampleRate);
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        buffer.getChannelData(ch).set(decoded.getChannelData(ch), pad);
      }

      const source = c.createBufferSource();
      source.buffer = buffer;
      // source -> analyser -> speakers, so playbackLevel() can read amplitude.
      const analyser = c.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyser.connect(c.destination);
      playbackAnalyser = analyser;
      playbackData = new Float32Array(analyser.fftSize);
      source.onended = () => {
        if (currentSource === source) currentSource = null;
        if (playbackAnalyser === analyser) {
          playbackAnalyser = null;
          playbackData = null;
        }
        finish();
      };
      currentSource = source;
      source.start(c.currentTime + 0.02);
      return;
    } catch {
      /* fall through to HTMLAudio */
    }
  }

  // Fallback for browsers without a usable Web Audio context.
  try {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "audio/mpeg" }));
    if (mine !== seq) {
      URL.revokeObjectURL(url);
      return;
    }
    const audio = new Audio();
    currentAudio = audio;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
    };
    audio.onended = () => {
      cleanup();
      finish();
    };
    audio.onerror = () => {
      cleanup();
      finish();
    };
    audio.src = url;
    await audio.play().catch(() => {
      cleanup();
      finish();
    });
  } catch {
    finish();
  }
}

/** Shared context for the mic analyser, so we run one AudioContext, not two. */
export function sharedAudioContext(): AudioContext | null {
  return getCtx();
}
