# Models

Put the AI model files here before building the installer:

- `u2netp.onnx` (Fast)
- `isnet-general-use.onnx` (Balanced)
- `birefnet-general.onnx` (Best)

They are not stored on GitHub because of their size. When you run `app.py`, any missing model is downloaded automatically the first time it is used.
