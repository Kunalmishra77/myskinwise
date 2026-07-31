"use client";

import * as React from "react";
import {
  unlockAudio,
  playClip,
  cancelPlayback,
  sharedAudioContext,
  playbackLevel,
} from "@/lib/voice/audio-playback";
import { useLocale } from "@/lib/i18n/provider";
import { getSession, patchSession } from "@/lib/consultation/session";

export type VoiceState = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";
export type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";
export type VoiceTurn = {
  role: "user" | "assistant";
  content: string;
  cta?: CtaKind | null;
  /** When set, the UI shows a catalogue-derived combo for this concern. */
  recommendConcern?: string;
};

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

// Barge-in: while Riya is SPEAKING, the mic stays open (echo-cancelled) and
// watches for the user starting to talk. The bar is set deliberately HIGHER
// than SPEAK_RMS and requires a short sustained burst, because the mic also
// hears Riya's own voice from the speaker; echo cancellation removes most of
// it, and this margin absorbs the rest so a stray echo peak doesn't self-
// interrupt her.
const BARGE_RMS = 0.055;
const BARGE_SUSTAIN_FRAMES = 4;

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

  // Barge-in monitor (a second, lightweight mic open only while speaking).
  const bargeStreamRef = React.useRef<MediaStream | null>(null);
  const bargeRafRef = React.useRef<number | null>(null);
  const bargingRef = React.useRef(false);
  // Latest mic loudness (0..1) while listening, for the avatar animation.
  const levelRef = React.useRef(0);
  const greetedRef = React.useRef(false);
  // Lets the barge monitor call the latest startListening without a dep cycle.
  const startListeningRef = React.useRef<() => void>(() => {});

  /**
   * Current audio level, 0..1, for the avatar: the user's mic while listening,
   * Riya's own speech while speaking, and a calm 0 otherwise.
   */
  const getLevel = React.useCallback(() => {
    const s = stateRef.current;
    if (s === "listening") return levelRef.current;
    if (s === "speaking") return playbackLevel();
    return 0;
  }, []);

  const teardownBarge = React.useCallback(() => {
    if (bargeRafRef.current) {
      cancelAnimationFrame(bargeRafRef.current);
      bargeRafRef.current = null;
    }
    bargeStreamRef.current?.getTracks().forEach((t) => t.stop());
    bargeStreamRef.current = null;
  }, []);

  // Opens the mic DURING playback and, when the user starts talking, cancels
  // Riya mid-sentence and switches to listening — hands-free interruption.
  const startBargeMonitor = React.useCallback(async () => {
    const ctx = sharedAudioContext();
    if (!ctx || bargeStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      // If playback already ended while we were awaiting permission, bail.
      if (stateRef.current !== "speaking") {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      bargeStreamRef.current = stream;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      let over = 0;

      const tick = () => {
        if (stateRef.current !== "speaking" || !bargeStreamRef.current) return;
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i]! * data[i]!;
        const rms = Math.sqrt(sum / data.length);
        if (rms > BARGE_RMS) {
          over++;
          if (over >= BARGE_SUSTAIN_FRAMES) {
            // The user is talking over her — stop Riya and start listening.
            bargingRef.current = true;
            cancelPlayback();
            teardownBarge();
            startListeningRef.current();
            return;
          }
        } else {
          over = 0;
        }
        bargeRafRef.current = requestAnimationFrame(tick);
      };
      bargeRafRef.current = requestAnimationFrame(tick);
    } catch {
      // No barge-in available (permission/hardware); tapping still interrupts.
    }
  }, [teardownBarge]);

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
    levelRef.current = 0;
  }, []);

  // Full stop: end the conversation and release the mic + playback.
  const stop = React.useCallback(() => {
    activeRef.current = false;
    cancelPlayback();
    teardownMic();
    teardownBarge();
    setState("idle");
  }, [teardownMic, teardownBarge]);

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
          // Carry the unified-session context so every voice turn stays grounded
          // in what the user told us and in their scan, if they have one.
          body: JSON.stringify({
            history,
            wantAudio: true,
            lang: getSession().aiLang ?? locale,
            analysisReference: getSession().analysisReference,
            concern: getSession().concern,
            ...body,
          }),
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
        setTurns((prev) => [
          ...prev,
          { role: "assistant", content: data.text, cta: data.cta, recommendConcern: data.recommendConcern },
        ]);

        // Speak the reply. The barge monitor opens the mic DURING playback so
        // the user can just start talking to interrupt; when playback ends on
        // its own, re-open the mic so the conversation continues hands-free.
        if (data.audioBase64) {
          bargingRef.current = false;
          setState("speaking");
          void startBargeMonitor();
          await playClip(data.audioBase64, () => {
            teardownBarge();
            // If the user barged in, the monitor already switched us to
            // listening — don't start a second turn on top of it.
            if (bargingRef.current) {
              bargingRef.current = false;
              return;
            }
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
          levelRef.current = Math.min(1, rms * 6); // drive the avatar
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

  // Always point at the freshest startListening, so the barge monitor and the
  // greeting can trigger listening without being memoised against a stale one.
  React.useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  function stopRecording() {
    if (recRef.current && recRef.current.state === "recording") {
      try {
        recRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Riya introduces herself. Fetches her fixed greeting's speech, shows it, and
   * speaks it — then opens the mic so the conversation just continues. Runs at
   * most once per conversation. If audio isn't available she still appears in
   * the transcript and we go straight to listening.
   */
  const greet = React.useCallback(async () => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    activeRef.current = true;
    unlockAudio();
    setNote(null);
    setState("thinking");
    try {
      const res = await fetch("/api/v1/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ greeting: true, wantAudio: true, lang: getSession().aiLang ?? locale, history: [] }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status === "ok" && data.text) {
        setTurns([{ role: "assistant", content: data.text }]);
      }
      if (data?.audioBase64) {
        bargingRef.current = false;
        setState("speaking");
        void startBargeMonitor();
        await playClip(data.audioBase64, () => {
          teardownBarge();
          if (bargingRef.current) {
            bargingRef.current = false;
            return;
          }
          if (activeRef.current) startListeningRef.current();
          else setState("idle");
        });
      } else {
        setState("idle");
        if (activeRef.current) startListeningRef.current();
      }
    } catch {
      setState("idle");
    }
  }, [locale, startBargeMonitor, teardownBarge]);

  /**
   * Riya reads back the user's Skin Analyzer result — the scan → voice handoff.
   * The reply is model-generated from the (customer-safe) analysis, so she
   * describes what was visible in THIS person's scan, never a scripted line.
   * Marked explained so she narrates a given scan once, not on every open.
   */
  const explain = React.useCallback(async () => {
    const s = getSession();
    if (!s.analysisReference) return;
    greetedRef.current = true; // an explanation is her opener for this session
    activeRef.current = true;
    unlockAudio();
    setNote(null);
    setState("thinking");
    patchSession({ explainedRef: s.analysisReference });
    try {
      const res = await fetch("/api/v1/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          explain: true,
          wantAudio: true,
          lang: getSession().aiLang ?? locale,
          history: [],
          analysisReference: s.analysisReference,
          concern: s.concern,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status === "ok" && data.text) {
        setTurns((prev) => [
          ...prev,
          { role: "assistant", content: data.text, cta: data.cta, recommendConcern: data.recommendConcern },
        ]);
      }
      if (data?.audioBase64) {
        bargingRef.current = false;
        setState("speaking");
        void startBargeMonitor();
        await playClip(data.audioBase64, () => {
          teardownBarge();
          if (bargingRef.current) {
            bargingRef.current = false;
            return;
          }
          if (activeRef.current) startListeningRef.current();
          else setState("idle");
        });
      } else {
        setState("idle");
        if (activeRef.current) startListeningRef.current();
      }
    } catch {
      setState("idle");
    }
  }, [locale, startBargeMonitor, teardownBarge]);

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
      // Manual barge-in (the tap version of the auto barge monitor).
      bargingRef.current = true;
      cancelPlayback();
      teardownBarge();
      activeRef.current = true;
      void startListening();
      return;
    }
    // idle / error -> begin. On the very first tap: if the user arrived from a
    // fresh scan, Riya explains their results; otherwise she greets herself.
    // After that, a tap just starts listening.
    activeRef.current = true;
    const sess = getSession();
    if (sess.analysisReference && sess.analysisReference !== sess.explainedRef) void explain();
    else if (!greetedRef.current) void greet();
    else void startListening();
  }, [startListening, greet, explain, teardownBarge]);

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
    greetedRef.current = false;
  }, [stop]);

  return { state, turns, note, toggle, stop, reset, sendText, greet, getLevel };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result as string).split(",")[1] ?? "");
    r.readAsDataURL(blob);
  });
}
