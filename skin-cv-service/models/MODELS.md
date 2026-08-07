# Model registry

Every shipped model weight is recorded here with its provenance, so `/healthz`
can surface the hash and any result is traceable to the exact weights that
produced it.

| Model | File | SHA-256 | Training data | Val metrics | Date |
|---|---|---|---|---|---|
| _(none yet)_ | — | — | — | — | — |

The acne detector (YOLOv11-nano → ONNX) lands in Phase 5. Until then the engine
uses only classical CV (Phases 2–4), which needs no weights.
