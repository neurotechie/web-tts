import React, { useState, useEffect, useCallback } from "react";
import { KokoroTTS } from "kokoro-js";
import { WaveFile } from "wavefile";
import "./App.css";

interface TTSError extends Error {
  message: string;
}

function App() {
  const [inputText, setInputText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [tts, setTts] = useState<KokoroTTS | null>(null);

  type VoiceOption =
    | "am_fenrir"
    | "af_heart"
    | "af_alloy"
    | "af_aoede"
    | "af_bella"
    | "af_jessica"
    | "af_kore"
    | "af_nicole"
    | "af_nova"
    | "af_river"
    | "af_sarah"
    | "af_sky"
    | "am_adam"
    | "am_echo"
    | "am_eric"
    | "am_liam"
    | "am_michael"
    | "am_onyx"
    | "am_puck"
    | "am_santa"
    | "bf_alice"
    | "bf_emma"
    | "bf_isabella"
    | "bf_lily"
    | "bm_daniel"
    | "bm_fable"
    | "bm_george"
    | "bm_lewis";
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("am_fenrir"); // Default voice

  const voiceData = [
    {
      language: "American English",
      name: "af_heart",
      traits: "🚺❤️",
      targetQuality: "A",
      trainingDuration: "",
      overallGrade: "A",
    },
    {
      language: "American English",
      name: "af_alloy",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "American English",
      name: "af_aoede",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_bella",
      traits: "🚺🔥",
      targetQuality: "A",
      trainingDuration: "HH hours",
      overallGrade: "A-",
    },
    {
      language: "American English",
      name: "af_jessica",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "af_kore",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_nicole",
      traits: "🚺🎧",
      targetQuality: "B",
      trainingDuration: "HH hours",
      overallGrade: "B-",
    },
    {
      language: "American English",
      name: "af_nova",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "American English",
      name: "af_river",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "af_sarah",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_sky",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "M minutes 🤏",
      overallGrade: "C-",
    },
    {
      language: "American English",
      name: "am_adam",
      traits: "🚹",
      targetQuality: "D",
      trainingDuration: "H hours",
      overallGrade: "F+",
    },
    {
      language: "American English",
      name: "am_echo",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_eric",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_fenrir",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_liam",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_michael",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_onyx",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_puck",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_santa",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "M minutes 🤏",
      overallGrade: "D-",
    },
    {
      language: "British English",
      name: "bf_alice",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bf_emma",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "HH hours",
      overallGrade: "B-",
    },
    {
      language: "British English",
      name: "bf_isabella",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bf_lily",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bm_daniel",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bm_fable",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bm_george",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bm_lewis",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "H hours",
      overallGrade: "D+",
    },
  ];

  useEffect(() => {
    async function loadModel() {
      try {
        setIsLoading(true);
        setModelLoadingProgress(0);
        console.log("Starting model loading...");
        const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
        const ttsInstance = await KokoroTTS.from_pretrained(model_id, {
          dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
          device: "wasm",
          progress_callback: (progressInfo) => {
            console.log("Progress info:", progressInfo);
            if ("progress" in progressInfo) {
              // Keep progress at 90% max during download, save last 10% for initialization
              const progress = Math.min(
                0.9,
                Math.max(0, progressInfo.progress || 0)
              );
              setModelLoadingProgress(progress);
            }
          },
        });

        // Set progress to 95% during model initialization
        setModelLoadingProgress(0.95);
        console.log("Model downloaded, initializing...");

        // Verify the model is working by testing a small generation
        await ttsInstance.generate("test", { voice: "af_heart" });

        // Model is fully ready
        setModelLoadingProgress(1);
        console.log("Model loaded and initialized successfully");
        setTts(ttsInstance);
        setIsLoading(false);
      } catch (error: unknown) {
        const ttsError = error as TTSError;
        const errorMessage = ttsError.message || "Unknown error occurred";
        console.error("Error loading TTS model:", ttsError);
        alert(
          `Failed to load TTS model: ${errorMessage}. Please try refreshing the page.`
        );
        setIsLoading(false);
      }
    }

    loadModel();
  }, []);

  const generateTTS = useCallback(async () => {
    if (!tts) {
      alert("TTS model is still loading. Please wait.");
      return;
    }

    if (!inputText.trim()) {
      alert("Please enter some text to convert to speech.");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);
    setGenerationProgress(0);

    try {
      // Use direct generation instead of streaming
      const result = await tts.generate(inputText, {
        voice: selectedVoice,
      });

      // Convert to WAV
      const outputWav = new WaveFile();
      outputWav.fromScratch(
        1,
        result.sampling_rate,
        "16",
        float32ToInt16(result.audio)
      );
      const wavBuffer = outputWav.toBuffer();
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const wavUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(wavUrl);
      setGenerationProgress(1); // Set to complete
    } catch (error: unknown) {
      const ttsError = error as TTSError;
      const errorMessage = ttsError.message || "Unknown error occurred";
      console.error("Error generating TTS:", ttsError);
      alert(
        `Error generating TTS: ${errorMessage}. Please check the console for details.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, tts, selectedVoice]);

  // Helper function to convert Float32 samples to Int16 samples
  const float32ToInt16 = (buffer: Float32Array): Int16Array => {
    const l = buffer.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return result;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value as VoiceOption);
  };

  return (
    <div className="App">
      <h1>Text-to-Speech Generator</h1>

      {/* Model Loading Progress */}
      {(isLoading || !tts) && (
        <div className="progress-bar-container">
          <label>
            {modelLoadingProgress < 0.9
              ? "Downloading Model: "
              : modelLoadingProgress < 1
              ? "Initializing Model: "
              : "Finalizing: "}
            {Math.min(100, Math.round(modelLoadingProgress * 100))}%
          </label>
          <progress
            value={Math.min(1, modelLoadingProgress)}
            max="1"
          ></progress>
        </div>
      )}

      <select value={selectedVoice} onChange={handleVoiceChange}>
        {voiceData
          .filter((voice) =>
            ["A", "B", "C"].includes(voice.overallGrade.charAt(0))
          )
          .map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} - {voice.traits.includes("🚺") ? "Female" : "Male"} (
              {voice.language})
            </option>
          ))}
      </select>
      <textarea
        rows={10}
        cols={50}
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter text to convert to speech..."
      />
      <button onClick={generateTTS} disabled={isLoading || !tts}>
        {isLoading ? "Generating..." : tts ? "Generate" : "Loading Model..."}
      </button>

      {/* Generation Progress */}
      {isLoading && generationProgress > 0 && (
        <div className="progress-bar-container">
          <label>
            Generating Audio: {Math.round(generationProgress * 100)}%
          </label>
          <progress value={generationProgress} max="1"></progress>
        </div>
      )}

      {audioUrl && (
        <div>
          <audio controls src={audioUrl} />
          <a href={audioUrl} download="tts-output.wav">
            Download WAV
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
