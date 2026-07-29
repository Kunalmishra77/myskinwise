"use client";

import * as React from "react";
import { unlockAudio, playClip, cancelPlayback, sharedAudioContext } from "@/lib/voice/audio-playback";
import { useLocale } from "@/lib/i18n/provider";

export type VoiceState = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";
export type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
export type VoiceTurn = { role: "user" | "assistant"; content: string; cta?: CtaKind | null };

/**
 * The whole voice-to-voice loop in one hook, shared by the overlay and the
 * /voice page so there is a single implementation of the hard part.
 *
 * The loop, hands-free: the user taps once to begin, and from then on the mic
 * opens on its own after each reply. A turn ends when the caller falls silent —
 * detected with a Web Audio analyser on the mic stream — not when they tap a
 * stop button, which is what makes it feel like a conversation rather than a
 * walkie-talkie. Tapping while the assistant speaks interrupts it (barge-in).
 *
 * Transcription is MediaRecorder -> ElevenLabs Scribe on the server, chosen
 * over the browser Web Speech API because Scribe works on every browser, not
 * just desktop Chrome. Playback goes through the unlocked AudioContext in
 * audio-playback.ts, which is what makes the reply actually speak on mobile.
 */

// Tuning, in milliseconds / normalised RMS.
const SILENCE_RMS = 0.012; // below this counts as silence
const SPEAK_RMS = 0.02; // above this counts as speech having started
const END_SILENCE_MS = 1300; // silence after speech before we finalise the turn
const GRACE_MS = 8000; // wait this long for speech to START before giving up
const MAX_TURN_MS = 20000; // hard cap on one spoken turn

export function useVoiceConversation(opts: { autoListen?: boolean } = {}) {
  const autoListen = opts.autoListen ?? true;
  const locale = useLocale();

  const [state, setState] = React.useState<VoiceState>("idle");
  const [turns, setTurns] = React.useState<VoiceTurn[]>([]);
  const [note, setNote] = React.useState<string | null>(null);

  const stateRef = React.useRef<VoiceState>("idle");
  const turnsRef = React.useRef<VoiceTurn[]>([]);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const activeRef = React.useRef(false); // conversation is running (vs stopped)

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  React.useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const teardownMic = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recRef.current && recRef.current.state === "recording") {
      try {
        recRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  // Full stop: end the conversation and release the mic + playback.
  const stop = React.useCallback(() => {
    activeRef.current = false;
    cancelPlayback();
    teardownMic();
    setState("idle");
  }, [teardownMic]);

  React.useEffect(() => () => stop(), [stop]);

  const submit = React.useCallback(
    async (body: Record<string, unknown>, optimisticUser?: string) => {
      if (optimisticUser) {
        setTurns((prev) => [...prev, { role: "user", content: optimisticUser }]);
      }
      const history = turnsRef.current.map((t) => ({ role: t.role, content: t.content }));
      setState("thinking");
      try {
        const res = await fetch("/api/v1/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ history, wantAudio: true, lang: locale, ...body }),
        });
        if (res.status === 429) {
          setNote("You've spoken a lot just now — please wait a little while.");
          setState("error");
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || data.status === "stt_failed") {
          setNote(data?.message ?? "I couldn't catch that — please try again, or type instead.");
          setState("error");
          return;
        }
        if (data.status !== "ok") {
          setNote(data.message ?? "Something went wrong. Please try again.");
          setState("error");
          return;
        }
        if (!optimisticUser && data.transcript) {
          setTurns((prev) => [...prev, { role: "user", content: data.transcript }]);
        }
        setTurns((prev) => [...prev, { role: "assistant", content: data.text, cta: data.cta }]);

        // Speak the reply, then re-open the mic so the conversation continues
        // on its own.
        if (data.audioBase64) {
          setState("speaking");
          await playClip(data.audioBase64, () => {
            if (activeRef.current && autoListen) void startListening();
            else setState("idle");
          });
        } else {
          setState("idle");
          if (activeRef.current && autoListen) void startListening();
        }
      } catch {
        setNote("We couldn't reach the assistant. Please check your connection and try again.");
        setState("error");
      }
    },
    // startListening is defined below; the ref indirection avoids a cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoListen],
  );

  const startListening = React.useCallback(async () => {
    cancelPlayback();
    setNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recRef.current = mr;
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        // Under ~1.5KB means no real speech — go quiet without pestering the
        // server, and (if hands-free) simply listen again.
        if (blob.size < 1500) {
          if (activeRef.current && autoListen && stateRef.current === "listening") {
            setState("idle");
            void startListening();
          } else {
            setState("idle");
          }
          return;
        }
        setState("transcribing");
        const base64 = await blobToBase64(blob);
        await submit({ audioBase64: base64, audioMimeType: blob.type });
      };

      // Silence detection via an analyser on the live mic.
      const ctx = sharedAudioContext();
      let spoke = false;
      let silenceStart = 0;
      const startedAt = Date.now();
      if (ctx) {
        const srcNode = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        srcNode.connect(analyser);
        analyserRef.current = analyser;
        const data = new Float32Array(analyser.fftSize);

        const tick = () => {
          if (!recRef.current || recRef.current.state !== "recording") return;
          analyser.getFloatTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i]! * data[i]!;
          const rms = Math.sqrt(sum / data.length);
          const now = Date.now();

          if (rms > SPEAK_RMS) {
            spoke = true;
            silenceStart = 0;
          } else if (rms < SILENCE_RMS && spoke) {
            if (!silenceStart) silenceStart = now;
            else if (now - silenceStart > END_SILENCE_MS) {
              stopRecording();
              return;
            }
          }
          // Gave them GRACE_MS to start; if still nothing, stop and stay idle.
          if (!spoke && now - startedAt > GRACE_MS) {
            stopRecording();
            return;
          }
          if (now - startedAt > MAX_TURN_MS) {
            stopRecording();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }

      setState("listening");
      mr.start();
    } catch {
      setNote("We couldn't use your microphone. Please allow access, or type instead.");
      setState("error");
      activeRef.current = false;
    }
  }, [autoListen, submit]);

  function stopRecording() {
    if (recRef.current && recRef.current.state === "recording") {
      try {
        recRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }

  /** The single control the UI drives: tap to begin / end a turn / interrupt. */
  const toggle = React.useCallback(() => {
    unlockAudio();
    const s = stateRef.current;
    if (s === "listening") {
      // Manual end of turn.
      stopRecording();
      return;
    }
    if (s === "speaking") {
      // Barge-in.
      cancelPlayback();
      activeRef.current = true;
      void startListening();
      return;
    }
    // idle / error -> begin.
    activeRef.current = true;
    void startListening();
  }, [startListening]);

  const sendText = React.useCallback(
    (text: string) => {
      unlockAudio();
      activeRef.current = true;
      void submit({ transcript: text }, text);
    },
    [submit],
  );

  const reset = React.useCallback(() => {
    stop();
    setTurns([]);
    setNote(null);
  }, [stop]);

  return { state, turns, note, toggle, stop, reset, sendText };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result as string).split(",")[1] ?? "");
    r.readAsDataURL(blob);
  });
}
