# Phase 9 — Validation & Calibration Protocol

The engine is deterministic and complete, but its 0–100 scores are **"Beta"**
until validated against real people. This is the last mile. The tooling is built;
these are the steps + acceptance criteria (blueprint §11).

---

## 1. Determinism (automated — already done)
CI runs the determinism harness on every push (`skin-cv-service` workflow). Same
image → byte-identical output, warm + cold process. **Blocking, zero tolerance.**

## 2. Repeatability (manual — needs ~25 people)
Same person, photographed multiple times, must score consistently.

**Recruit 25 people spanning Fitzpatrick II–VI.** For each:
- 5 scans in one session, same room + light, ~1 min apart.
- 3 scans across different rooms/lighting the same day.

**Record each scan's scores** (they're saved to `skin_analyses.engine_result`,
tagged by the lead). Then run the analysis:

```
node scripts/repeatability.mjs <leadId>     # prints per-concern SD + max spread
```

**Pass criteria:**
- Same-session standard deviation ≤ **4** points on every concern.
- Cross-lighting max deviation ≤ **8** points on every concern.
- **Stratify by Fitzpatrick.** If types V–VI are materially worse than II–III,
  the normalisation (white balance / L\*) needs work before launch.

## 3. Calibration (needs ~5,000 real scans — happens with usage)
Anchor scores are literature-seeded. Once real scans accumulate:

```
node scripts/calibrate-scores.mjs           # prints data-driven anchor tables
```

Review the output, paste per-concern blocks into
`skin-cv-service/config/anchors_v1.yaml`, and **bump `PIPELINE_VERSION`**. This
turns each score into a real population percentile (score ≈ 100 − percentile
rank) — the point where the numbers become genuinely meaningful, and a moat an
API vendor can't hand you.

## 4. Dermatologist face-validity (needs a dermatologist — a person)
A qualified dermatologist reviews scan outputs blind and rates each concern's
overlay **accurate / partial / wrong**.

- Use the review dashboard: **`/admin/review`** (admin login). It shows the
  photo + the engine's evidence masks + scores, and captures a per-concern
  verdict. Results are stored on the scan and summarised.
- Review **100 scans**. **Target: ≥ 70 % accurate, ≤ 10 % wrong** at launch.
- This is a sanity check that catches embarrassing failures — **not** a clinical
  validation study, and must never be described as one.

## 5. Adversarial set (automated — extendable)
A fixture set that must ALL be **rejected** by the capture gate: makeup-heavy,
beard over the jaw, sunglasses, a printed photo of a face, a screen showing a
face, extreme backlight, two faces, a non-face image. Add these under
`skin-cv-service/tests/fixtures/adversarial/` and assert the gate returns a
non-`passed` verdict for each.

---

## What only you can provide
- **25 test people** (repeatability) — real humans, spanning skin tones.
- **~5,000 real scans** (calibration) — accumulate through normal usage.
- **A dermatologist** (face-validity) — hire or partner; the blueprint suggests a
  part-time dermatologist reviewing flagged high-severity scans as the strongest
  trust differentiator and a modest cost.

Everything else — the analysis scripts, the calibration pipeline, the review
dashboard — is built and ready.
