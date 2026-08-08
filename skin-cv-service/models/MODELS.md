# Model registry

Every shipped model weight is recorded here with its provenance, so `/healthz`
can surface the hash and any result is traceable to the exact weights that
produced it.

| Model | File | SHA-256 | Training data | Val metrics | Date |
|---|---|---|---|---|---|
| Acne (YOLOv11-nano) | `acne_yolo11n_v1.onnx` | _(add on deploy)_ | _(dataset used)_ | _(mAP@50)_ | _(pending)_ |

## Acne model — how it plugs in

1. Train it with `training/train_acne_colab.ipynb` (Colab, free GPU). It exports
   `acne_yolo11n_v1.onnx` (opset 17, NMS excluded).
2. Drop the file here as **`models/acne_yolo11n_v1.onnx`**.
3. `app/pipeline/m1_acne.py` loads it automatically (ONNX Runtime, single-thread,
   deterministic NMS, skin-mask filtering). Until the file exists, acne returns
   no score and the engine runs fine on the other 7 concerns.

`.gitignore` ignores `models/*.onnx` by default (weights are large). To deploy
the model, either commit it explicitly (`git add -f models/acne_yolo11n_v1.onnx`
— a YOLO-nano ONNX is ~10 MB, fine to commit) or fetch it at container build.
Record its SHA-256 (printed by the notebook) in the table above and bump
`PIPELINE_VERSION` when it changes.
