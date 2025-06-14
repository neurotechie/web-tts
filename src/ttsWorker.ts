import { KokoroTTS } from "kokoro-js";

// Define message types for communication
type InitMessage = {
  type: "init";
  modelId: string;
  dtype: string;
  device: string;
  isMobile?: boolean; // Flag for mobile optimizations
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
let isMobileDevice = false;
let modelLoaded = false;

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

  // Store mobile status for optimizations
  isMobileDevice = data.isMobile ?? false;

  // Different model options for mobile
  const modelParams = {
    dtype: isMobileDevice ? "q4" : data.dtype, // Lower precision for mobile
    device: data.device,
    progress_callback: (progressInfo: any) => {
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
    // Small models for mobile, default chunks for desktop
    max_chunk_size: isMobileDevice ? 150 : 300,
    // Enable GC for mobile
    gc_after_init: isMobileDevice,
  };

  try {
    tts = await KokoroTTS.from_pretrained(data.modelId, modelParams);

    // Set progress to 95% during model initialization
    self.postMessage({
      type: "progress",
      progress: 0.95,
      message: "Initializing model",
    } as ProgressMessage);

    // Verify the model is working by testing a small generation
    // Use shorter test input on mobile
    await tts.generate("test", { voice: "af_heart" });

    // Model is fully ready
    modelLoaded = true;
    self.postMessage({
      type: "progress",
      progress: 1,
      message: "Model loaded successfully",
    } as ProgressMessage);
  } catch (error) {
    // Specific mobile error handling
    if (isMobileDevice) {
      self.postMessage({
        type: "error",
        message: `Mobile device detected. Error loading TTS model: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Try using smaller text chunks or refresh the page.`,
      } as ErrorMessage);
    } else {
      throw error; // Let the main catch handle this
    }
  }
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

  try {
    // Mobile-specific optimizations for generation
    const options = {
      voice: data.voice,
      // Use smaller batch sizes on mobile for better memory management
      batch_size: isMobileDevice ? 4 : 8,
    };

    // Generate speech
    const result = await tts.generate(data.text, options);

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

    // Periodically clean up memory on mobile
    if (isMobileDevice && data.chunkIndex > 0 && data.chunkIndex % 3 === 0) {
      // Force garbage collection on some platforms
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to generate speech: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
