# Edge Multimodal Visual Inspector (Track A — 90-Day Build)

A step-by-step, learning-by-building Edge & Multimodal AI engineering project following `Notes and Images/Track A - Edge & Multimodal AI Engineer Guide.docx`.

The goal is to build **one unified local AI camera inspection system** from scratch: starting from shrinking an image AI model in **Google Colab**, testing it on real mobile/edge chips in the cloud, adding plain-English visual question answering, and finishing with a fast local live-video app.

---

## Plain-English Glossary (Zero-Jargon Quick Reference)

Whenever you see a heavy tech word in this project, check here first:

| Tech Term | Simple School-Level Explanation |
| :--- | :--- |
| **Edge AI** | Running AI **directly on a device** (phone, smart camera, laptop, factory box) offline—instead of sending photos over the internet to a giant cloud server. |
| **PyTorch** | The "workshop" (Python library) where engineers build and train AI models. Great for experimenting, but a bit heavy for tiny devices. |
| **ONNX** *(Open Neural Network Exchange)* | A **universal blueprint file** for AI models. Think of PyTorch as a `.docx` file (needs Word) and **ONNX as a `.pdf` file** that can run cleanly almost anywhere. |
| **ONNX Runtime (ORT)** | The fast **"PDF reader" engine** that opens an `.onnx` file and runs its math super quickly on a CPU, GPU, or edge chip. |
| **Parameters / Weights** | The millions of tiny tuned "volume knobs" inside an AI model that store everything it learned during training. |
| **FP32** *(32-bit Float)* | Storing each model number as a super-detailed decimal (e.g., `3.14159265`). Accurate, but heavy (**4 bytes** per number—like a giant RAW camera photo). |
| **INT8** *(8-bit Integer)* | Rounding each model number to a simple whole number (like `0` to `255` or `-128` to `127`). Takes only **1 byte** (**4x smaller**—like turning a RAW photo into a crisp JPEG). |
| **Quantization** | The process of shrinking a model's numbers from heavy **FP32** decimals down to tiny **INT8** (or 4-bit) whole numbers so it uses less memory and runs faster. |
| **Latency (ms) & FPS** | **Latency** = milliseconds to process 1 image (lower is better). **FPS** (Frames Per Second) = how many images it can process in 1 second (`1000 / latency_ms`). |
| **p95 Latency** | Your "near worst-case" speed—95% of images finish faster than this. Crucial for live video because even occasional slow spikes cause stuttering. |
| **Docker** | A lightweight "shipping container" that packs your code and exact software versions together so it runs identically on any Linux computer. |
| **TensorRT** | NVIDIA's turbo-charged engine that converts an ONNX model into custom ultra-fast code built specifically for NVIDIA GPUs. |
| **Qualcomm AI Hub** | A free cloud lab where you upload your `.onnx` model from Python and test its real speed and memory on actual Snapdragon phone/edge chips—without buying hardware. |
| **VLM** *(Vision-Language Model)* | An AI that can **both see an image and read/write English** (e.g., *"Is the safety cap missing on this bottle?"*). |
| **SAM** *(Segment Anything Model)* | A smart "digital scissors" AI from Meta that can outline and cut out any exact object inside a photo. |
| **C++ Wrapper** | A thin, ultra-fast piece of C++ code that calls the AI model directly—removing Python's small slowdown for real-time cameras. |
| **OpenCV / GStreamer** | Tools that read live video frames from a webcam or camera stream cleanly and quickly. |
| **FastAPI** | A simple, fast Python tool for sending lightweight web alerts/messages (like *"Defect detected!"*) to a dashboard. |

---

## Project Tree Structure (Single Root)

All project files stay neatly inside **one single folder** (`edge-multimodal-inspector/`):

```text
edge-multimodal-inspector/
├── README.md                                     # Roadmap, plain-English glossary & benchmark table
├── notebooks/                                    # Google Colab notebooks (learning & experiments)
│   └── 01_pytorch_to_onnx_int8_colab.ipynb       # [Step 1] PyTorch -> ONNX -> Dynamic vs Static INT8
├── src/                                          # Production Python code (added from Step 2+)
│   ├── export/                                   # Model export & quantization scripts
│   ├── inference/                                # ONNX Runtime, TensorRT, VLM & SAM runners
│   ├── benchmark/                                # Speed, memory, size & accuracy measurement tools
│   └── pipeline/                                 # Live camera stream + FastAPI alert dashboard
├── cpp_runner/                                   # [Phase 3] Fast C++ inference wrapper
├── docker/                                       # [Phase 1 & 3] Reproducible Linux containers
└── benchmarks/                                   # Saved JSON/CSV speed & accuracy reports
```

*(New folders are created only when we reach the step that needs them so nothing gets cluttered.)*

---

## Learning Roadmap (One Step at a Time)

### Phase 1 (Days 1–30): Shrinking Models & Making Them Fast
- [ ] **Step 1 (Current):** Convert a PyTorch image model (`ResNet-18`) to universal **ONNX**, shrink it to **INT8** using both Dynamic and Static methods, and measure size, speed, and accuracy in Google Colab (`notebooks/01_pytorch_to_onnx_int8_colab.ipynb`).
- [ ] **Step 2:** Turn the notebook code into clean, reusable Python scripts under `src/export/` & `src/benchmark/`, add GPU/FP16 speed tests, and measure real accuracy drop on an inspection dataset.
- [ ] **Step 3:** Package the runner inside a Linux **Docker** container (`docker/`) and publish your **Day 30 Gate** benchmark table.

### Phase 2 (Days 31–60): Smart Camera Vision-Language & Real Chip Testing
- [ ] **Step 4:** Upload our optimized vision model to **Qualcomm AI Hub** to measure real speed and peak RAM on actual Snapdragon edge hardware.
- [ ] **Step 5:** Run a compact **Vision-Language Model (Qwen3-VL-4B)** + **SAM** locally so you can ask plain-English questions about camera images (**Day 60 Gate**).

### Phase 3 (Days 61–90): Live Local Video Pipeline & Portfolio Demo
- [ ] **Step 6:** Build a small **C++ ONNX Runtime wrapper** (`cpp_runner/`) and compare C++ speed vs. Python speed.
- [ ] **Step 7:** Connect live video input (**OpenCV/GStreamer**) + fast model checks + **FastAPI** alert dashboard (`src/pipeline/`) and record your **Day 90 Gate** demo video.

---

## Step 1 Benchmark Ledger (Fill After Running Notebook 01)

| Model Variant | Format | Size (MB) | Size Drop | Mean Latency (ms) | p95 Latency (ms) | Speedup vs PyTorch | Top-1 Agreement vs FP32 | Cosine Similarity |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| PyTorch ResNet-18 | FP32 | — | 0% | — | — | 1.00x | 100.0% | 1.0000 |
| ONNX Runtime | FP32 | — | — | — | — | — | — | — |
| ONNX Runtime | Dynamic INT8 | — | — | — | — | — | — | — |
| ONNX Runtime | Static INT8 (QDQ) | — | — | — | — | — | — | — |
