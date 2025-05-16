import { KokoroTTS } from "kokoro-js";

// Define message types for communication
type InitMessage = {
  type: "init";
  modelId: string;
  dtype: string;
  device: string;
};

type GenerateMessage = {
  type: "generate";
  text: string;
  voice: string;
  chunkIndex: number;
  totalChunks: number;
};

type ProgressMessage = {
  type: "progress";
  progress: number;
  message: string;
};

type ResultMessage = {
  type: "result";
  audio: Float32Array;
  samplingRate: number;
  chunkIndex: number;
  totalChunks: number;
};

type ErrorMessage = {
  type: "error";
  message: string;
};

// Main worker code
let tts: KokoroTTS | null = null;

// Handle messages from main thread
self.onmessage = async (event: MessageEvent) => {
  const data = event.data;

  try {
    switch (data.type) {
      case "init":
        await initTTS(data);
        break;
      case "generate":
        await generateTTS(data);
        break;
      default:
        throw new Error(`Unknown message type: ${data.type}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    self.postMessage({
      type: "error",
      message: errorMessage,
    } as ErrorMessage);
  }
};

// Initialize the TTS model
async function initTTS(data: InitMessage) {
  self.postMessage({
    type: "progress",
    progress: 0,
    message: "Starting model loading",
  } as ProgressMessage);

  tts = await KokoroTTS.from_pretrained(data.modelId, {
    dtype: data.dtype,
    device: data.device,
    progress_callback: (progressInfo) => {
      if ("progress" in progressInfo) {
        // Keep progress at 90% max during download, save last 10% for initialization
        const progress = Math.min(0.9, Math.max(0, progressInfo.progress || 0));
        self.postMessage({
          type: "progress",
          progress,
          message: "Downloading model",
        } as ProgressMessage);
      }
    },
  });

  // Set progress to 95% during model initialization
  self.postMessage({
    type: "progress",
    progress: 0.95,
    message: "Initializing model",
  } as ProgressMessage);

  // Verify the model is working by testing a small generation
  await tts.generate("test", { voice: "af_heart" });

  // Model is fully ready
  self.postMessage({
    type: "progress",
    progress: 1,
    message: "Model loaded successfully",
  } as ProgressMessage);
}

// Generate TTS for a text chunk
async function generateTTS(data: GenerateMessage) {
  if (!tts) {
    throw new Error("TTS model not initialized");
  }

  // Report progress
  self.postMessage({
    type: "progress",
    progress: data.chunkIndex / data.totalChunks,
    message: `Generating chunk ${data.chunkIndex + 1}/${data.totalChunks}`,
  } as ProgressMessage);

  // Generate speech
  const result = await tts.generate(data.text, { voice: data.voice });

  // Send result back to main thread
  self.postMessage(
    {
      type: "result",
      audio: result.audio,
      samplingRate: result.sampling_rate,
      chunkIndex: data.chunkIndex,
      totalChunks: data.totalChunks,
    } as ResultMessage,
    [result.audio.buffer]
  );
}
