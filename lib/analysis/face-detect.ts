"use client";

import type { FaceDetector } from "@mediapipe/tasks-vision";

/**
 * On-device face detection for the Skin Analyzer overlay.
 *
 * WHY: the vision LLM cannot reliably localise — its guessed boxes land in
 * hair, on the ceiling, or all in one spot. So we don't trust it for WHERE.
 * A real face detector (MediaPipe BlazeFace, self-hosted, ~230KB, runs once on
 * the still image) gives the ACTUAL face box + eye/nose keypoints. We anchor
 * each concern to a real anatomical point inside that box, so a marker is
 * always ON the face, never in the background.
 *
 * The LLM still decides WHAT is visible (shine, texture, dark circles…) and its
 * coarse region (forehead / cheek / under-eye); this just provides the geometry
 * to place those honestly. If no face is found we return null and the caller
 * falls back to the coarse region template.
 */

export type FaceRegion =
  | "forehead"
  | "left_cheek"
  | "right_cheek"
  | "nose"
  | "chin"
  | "under_eye_left"
  | "under_eye_right"
  | "jaw"
  | "overall";

export type FaceGeometry = {
  /** The detected face box, normalised 0..1 over the image (top-left origin). */
  box: { x: number; y: number; width: number; height: number };
  /** Anatomical anchor points, normalised 0..1 over the image. */
  regions: Record<FaceRegion, { x: number; y: number }>;
};

let detectorPromise: Promise<FaceDetector | null> | null = null;

async function getDetector(): Promise<FaceDetector | null> {
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    try {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return await FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/mediapipe/blaze_face_short_range.tflite" },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.4,
      });
    } catch {
      return null; // model/WASM failed to load — caller falls back
    }
  })();
  return detectorPromise;
}

/** Kick off model loading early (e.g. when the analyzer mounts). */
export function preloadFaceDetector(): void {
  void getDetector();
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Detects the face in a captured photo and derives anatomical anchor points.
 * Returns null if no usable face is found (caller falls back to the template).
 */
export async function detectFaceGeometry(dataUrl: string): Promise<FaceGeometry | null> {
  const detector = await getDetector();
  if (!detector) return null;
  const img = await loadImage(dataUrl);
  if (!img || !img.naturalWidth) return null;

  let result;
  try {
    result = detector.detect(img);
  } catch {
    return null;
  }
  const det = result?.detections?.[0];
  const bb = det?.boundingBox;
  if (!bb) return null;

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  // BlazeFace box is in pixels; normalise to 0..1.
  const bx = Math.max(0, bb.originX / iw);
  const by = Math.max(0, bb.originY / ih);
  const bw = Math.min(1 - bx, bb.width / iw);
  const bh = Math.min(1 - by, bb.height / ih);

  // Keypoints (normalised): typically [right eye, left eye, nose tip, mouth,
  // right ear, left ear]. Fall back to box-derived points if absent.
  const kp = det.keypoints ?? [];
  const eyeA = kp[0];
  const eyeB = kp[1];
  const nose = kp[2];
  const cx = bx + bw / 2;
  // Image-relative eyes: smaller x = the left of the picture.
  const eyes = eyeA && eyeB ? (eyeA.x < eyeB.x ? [eyeA, eyeB] : [eyeB, eyeA]) : null;
  const eyeL = eyes?.[0] ?? { x: bx + bw * 0.33, y: by + bh * 0.4 };
  const eyeR = eyes?.[1] ?? { x: bx + bw * 0.67, y: by + bh * 0.4 };
  const eyeY = (eyeL.y + eyeR.y) / 2;

  const regions: Record<FaceRegion, { x: number; y: number }> = {
    // Mid-forehead, not the hairline — the detected box top often includes hair,
    // so anchor low enough that the marker sits on skin.
    forehead: { x: cx, y: by + bh * 0.2 },
    left_cheek: { x: bx + bw * 0.24, y: eyeY + bh * 0.28 },
    right_cheek: { x: bx + bw * 0.76, y: eyeY + bh * 0.28 },
    nose: { x: nose?.x ?? cx, y: nose?.y ?? by + bh * 0.55 },
    chin: { x: cx, y: by + bh * 0.95 },
    under_eye_left: { x: eyeL.x, y: eyeL.y + bh * 0.06 },
    under_eye_right: { x: eyeR.x, y: eyeR.y + bh * 0.06 },
    jaw: { x: bx + bw * 0.28, y: by + bh * 0.82 },
    overall: { x: cx, y: by + bh * 0.5 },
  };

  return { box: { x: bx, y: by, width: bw, height: bh }, regions };
}
