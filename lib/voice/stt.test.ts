import { describe, expect, it } from "vitest";
import { __extensionForTest } from "./stt";

/**
 * The extension sent with a transcription upload decides whether the request
 * succeeds at all — OpenAI infers the container from the filename and rejects
 * a mismatch. A real audio/mpeg clip sent through the deployed voice endpoint
 * was being uploaded as `clip.wav` and failing every time, because the old
 * mapping knew only webm and mp4 and defaulted the rest to wav.
 *
 * The default is the point: this provider is the FALLBACK for browsers whose
 * recording format is unusual, so unusual formats are exactly what it must
 * handle.
 */
describe("STT upload extension", () => {
  it("maps the formats browsers actually record", () => {
    expect(__extensionForTest("audio/webm;codecs=opus")).toBe("webm");
    expect(__extensionForTest("audio/mp4")).toBe("mp4");
    expect(__extensionForTest("audio/ogg;codecs=opus")).toBe("ogg");
    expect(__extensionForTest("audio/wav")).toBe("wav");
  });

  it("maps mpeg/mp3 to mp3 rather than silently to wav", () => {
    // The exact regression: audio/mpeg became "wav" and every upload failed.
    expect(__extensionForTest("audio/mpeg")).toBe("mp3");
    expect(__extensionForTest("audio/mp3")).toBe("mp3");
  });

  it("is case-insensitive, since the header is client-supplied", () => {
    expect(__extensionForTest("AUDIO/WEBM")).toBe("webm");
    expect(__extensionForTest("Audio/MPEG")).toBe("mp3");
  });

  it("falls back to webm, not wav, for an unrecognised type", () => {
    // webm is what the overwhelming majority of MediaRecorder
    // implementations produce, so it is the least-bad guess.
    expect(__extensionForTest("application/octet-stream")).toBe("webm");
    expect(__extensionForTest("")).toBe("webm");
  });
});
