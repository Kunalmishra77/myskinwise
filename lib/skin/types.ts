/**
 * The ScanResult shape returned by the deterministic engine (skin-cv-service).
 * Mirrors the service JSON (blueprint §6.1) — this is the single type the app
 * trusts for the new scan. Kept deliberately close to the wire format so the
 * proxy can pass results straight through.
 */

export type QualityCheck = {
  name: string;
  passed: boolean;
  value: number | string | null;
  threshold: unknown;
  code?: string | null;
  error?: string | null;
};

export type ScanQuality = {
  passed: boolean;
  reason_code?: string | null;
  user_message?: string | null;
  checks?: QualityCheck[];
  measurement_error?: string;
};

export type ScanConcern = {
  id: string;
  score: number | null;
  severity: string | null;
  confidence: number | null;
  raw: Record<string, unknown>;
  by_region: Record<string, number>;
  /** Friendly display areas where this concern was seen, most-prominent first
   * (e.g. ["forehead", "left cheek"]). Derived by the engine from the same
   * evidence the overlay mask shows. Absent on older engine builds. */
  regions?: string[];
  mask_url: string | null;
};

export type ScanResult = {
  scan_id: string;
  pipeline_version: string;
  image_sha256: string;
  cached: boolean;
  processing_ms?: number;
  quality: ScanQuality;
  skin_tone: {
    median_ita_deg: number | null;
    fitzpatrick_estimate: string | null;
    note: string;
  };
  concerns: ScanConcern[];
  derived: {
    skin_type: string | null;
    skin_age_estimate: number | null;
    skin_age_confidence: number | null;
    white_balance_method?: string;
  };
};

/** 422 gate rejection or other non-success from the engine. */
export type ScanFailure = {
  error: string;
  reason_code?: string | null;
  user_message?: string | null;
  retryable?: boolean;
};

export type ScanOutcome =
  | { ok: true; result: ScanResult }
  | { ok: false; status: number; failure: ScanFailure };
