import React, { useState, useEffect, useCallback } from "react";
import { KokoroTTS } from "kokoro-js";
import { WaveFile } from "wavefile";
import {
  Typography,
  Select,
  Input,
  Button,
  Progress,
  Card,
  Space,
  Tooltip,
  Radio,
  Collapse,
} from "antd";
import "./App.css";
import "antd/dist/reset.css";

const { Title } = Typography;
const { TextArea } = Input;
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
  const [mode, setMode] = useState<"single" | "multi">("single");

  // Warn user if input is very long
  const LONG_TEXT_THRESHOLD = 2000; // characters
  const [longTextWarning, setLongTextWarning] = useState(false);
  useEffect(() => {
    setLongTextWarning(inputText.length > LONG_TEXT_THRESHOLD);
  }, [inputText]);

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
      displayName: "Sarah (American Female)",
      traits: "🚺❤️",
      targetQuality: "A",
      trainingDuration: "",
      overallGrade: "A",
    },
    {
      language: "American English",
      name: "af_alloy",
      displayName: "Emily (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "American English",
      name: "af_aoede",
      displayName: "Madison (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_bella",
      displayName: "Bella (American Female)",
      traits: "🚺🔥",
      targetQuality: "A",
      trainingDuration: "HH hours",
      overallGrade: "A-",
    },
    {
      language: "American English",
      name: "af_jessica",
      displayName: "Jessica (American Female)",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "af_kore",
      displayName: "Kora (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_nicole",
      displayName: "Nicole (American Female)",
      traits: "🚺🎧",
      targetQuality: "B",
      trainingDuration: "HH hours",
      overallGrade: "B-",
    },
    {
      language: "American English",
      name: "af_nova",
      displayName: "Nova (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "American English",
      name: "af_river",
      displayName: "River (American Female)",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "af_sarah",
      displayName: "Laura (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "af_sky",
      displayName: "Skylar (American Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "M minutes 🤏",
      overallGrade: "C-",
    },
    {
      language: "American English",
      name: "am_adam",
      displayName: "Adam (American Male)",
      traits: "🚹",
      targetQuality: "D",
      trainingDuration: "H hours",
      overallGrade: "F+",
    },
    {
      language: "American English",
      name: "am_echo",
      displayName: "Ethan (American Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_eric",
      displayName: "Eric (American Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_fenrir",
      displayName: "Felix (American Male)",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_liam",
      displayName: "Liam (American Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_michael",
      displayName: "Michael (American Male)",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_onyx",
      displayName: "Oliver (American Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "American English",
      name: "am_puck",
      displayName: "Peter (American Male)",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "H hours",
      overallGrade: "C+",
    },
    {
      language: "American English",
      name: "am_santa",
      displayName: "Nick (American Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "M minutes 🤏",
      overallGrade: "D-",
    },
    {
      language: "British English",
      name: "bf_alice",
      displayName: "Alice (British Female)",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bf_emma",
      displayName: "Emma (British Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "HH hours",
      overallGrade: "B-",
    },
    {
      language: "British English",
      name: "bf_isabella",
      displayName: "Isabella (British Female)",
      traits: "🚺",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bf_lily",
      displayName: "Lily (British Female)",
      traits: "🚺",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bm_daniel",
      displayName: "Daniel (British Male)",
      traits: "🚹",
      targetQuality: "C",
      trainingDuration: "MM minutes",
      overallGrade: "D",
    },
    {
      language: "British English",
      name: "bm_fable",
      displayName: "Frederick (British Male)",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bm_george",
      displayName: "George (British Male)",
      traits: "🚹",
      targetQuality: "B",
      trainingDuration: "MM minutes",
      overallGrade: "C",
    },
    {
      language: "British English",
      name: "bm_lewis",
      displayName: "Lewis (British Male)",
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

  // Debug logging toggle (set to true to enable logs, false to disable)
  const debugLogs = true;

  // Helper: Map display names to internal voice names (lowercase)
  const displayNameToVoice = Object.fromEntries(
    voiceData.map((v) => [v.displayName.split(" ")[0].toLowerCase(), v.name])
  );

  // Helper: Set of valid tag names for quick lookup
  const validTagNames = new Set(
    voiceData.map((v) => v.displayName.split(" ")[0].toLowerCase())
  );

  // Helper: Parse text for [VoiceName] tags and split into segments, with error collection
  function parseMultiVoiceText(
    text: string,
    defaultVoice: VoiceOption
  ): {
    segments: Array<{ voice: VoiceOption; text: string }>;
    errors: string[];
  } {
    const regex = /\[([A-Za-z]+)\]/g;
    let result: Array<{ voice: VoiceOption; text: string }> = [];
    let errors: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let currentVoice = defaultVoice;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const segText = text.slice(lastIndex, match.index).trim();
        if (segText.length > 0) {
          result.push({ voice: currentVoice, text: segText });
        } else {
          errors.push(
            `Empty segment before [${match[1]}] tag will be skipped.`
          );
        }
      }
      // Update voice if recognized (case-insensitive)
      const tag = match[1].toLowerCase();
      const mappedVoice = displayNameToVoice[tag];
      if (!validTagNames.has(tag)) {
        errors.push(
          `Unknown voice tag: [${match[1]}] will be ignored (using previous voice).`
        );
      }
      if (mappedVoice) {
        currentVoice = mappedVoice as VoiceOption;
      }
      lastIndex = regex.lastIndex;
    }
    // Remaining text
    const trailingText = text.slice(lastIndex).trim();
    if (trailingText.length > 0) {
      result.push({ voice: currentVoice, text: trailingText });
    } else if (lastIndex < text.length) {
      errors.push(`Empty segment at end of text will be skipped.`);
    }
    // Filter out empty segments (should not be needed, but for safety)
    result = result.filter((seg) => seg.text.length > 0);
    return { segments: result, errors };
  }

  const splitTextAtBreaks = (text: string, maxLen = 300): string[] => {
    // Split at sentence boundaries, but keep sentences together if short
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > maxLen && current.length > 0) {
        chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim().length > 0) chunks.push(current.trim());
    return chunks;
  };

  // Error state for user feedback
  const [parseErrors, setParseErrors] = useState<string[]>([]);

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
    setGenerationProgress(0.01); // Start progress bar immediately
    setParseErrors([]);

    try {
      // Phase 2: Parse for multi-voice segments and split for length, collect errors
      const { segments, errors } = parseMultiVoiceText(
        inputText,
        selectedVoice
      );
      setParseErrors(errors);
      if (segments.length === 0) {
        setIsLoading(false);
        alert("No valid text segments found to synthesize.");
        return;
      }
      let allChunks: { voice: VoiceOption; text: string }[] = [];
      for (const seg of segments) {
        const splits = splitTextAtBreaks(seg.text);
        for (const chunk of splits) {
          allChunks.push({ voice: seg.voice, text: chunk });
        }
      }
      if (debugLogs) console.log("[TTS] All chunks for synthesis:", allChunks);
      // Phase 3: Synthesize all chunks sequentially and concatenate audio
      let audioBuffers: Float32Array[] = [];
      let sampleRate = 24000; // fallback
      for (let i = 0; i < allChunks.length; i++) {
        setGenerationProgress(i / allChunks.length);
        const { voice, text } = allChunks[i];
        if (debugLogs)
          console.log(
            `[TTS] Synthesizing chunk ${i + 1}/${
              allChunks.length
            } with voice ${voice}`
          );
        const result = await tts.generate(text, { voice });
        sampleRate = result.sampling_rate;
        audioBuffers.push(result.audio);
      }
      setGenerationProgress(1);
      // Concatenate all Float32Array audio buffers
      const totalLength = audioBuffers.reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const joined = new Float32Array(totalLength);
      let offset = 0;
      for (const arr of audioBuffers) {
        joined.set(arr, offset);
        offset += arr.length;
      }
      // Convert to WAV
      const outputWav = new WaveFile();
      outputWav.fromScratch(1, sampleRate, "16", float32ToInt16(joined));
      const wavBuffer = outputWav.toBuffer();
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const wavUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(wavUrl);
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
  }, [inputText, tts, selectedVoice, debugLogs]);

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

  return (
    <div className="App">
      <Card bordered={false}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", gap: "16px" }}
        >
          <Title level={2} style={{ textAlign: "center", margin: 0 }}>
            Neuro TTS
          </Title>
          {/* Mode Toggle */}
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ width: "100%" }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="single">Single Voice</Radio.Button>
            <Radio.Button value="multi">Multi-Voice</Radio.Button>
          </Radio.Group>
          {/* Model Loading Progress */}
          {(isLoading || !tts) && (
            <div style={{ width: "100%" }}>
              <Typography.Text
                style={{ display: "block", marginBottom: "8px" }}
              >
                {modelLoadingProgress < 0.9
                  ? "Downloading Model"
                  : modelLoadingProgress < 1
                  ? "Initializing Model"
                  : "Finalizing"}
              </Typography.Text>
              <Progress
                percent={Math.min(100, Math.round(modelLoadingProgress * 100))}
                status="active"
                size="small"
              />
            </div>
          )}

          {/* Voice selection only in single mode */}
          {mode === "single" && (
            <Select
              value={selectedVoice}
              onChange={(value) => setSelectedVoice(value as VoiceOption)}
              style={{ width: "100%" }}
            >
              {voiceData
                .filter((voice) =>
                  ["A", "B", "C"].includes(voice.overallGrade.charAt(0))
                )
                .map((voice) => (
                  <Select.Option key={voice.name} value={voice.name}>
                    {voice.displayName}
                  </Select.Option>
                ))}
            </Select>
          )}

          {/* Multi-voice help in multi mode */}
          {mode === "multi" && (
            <>
              <Tooltip
                title={
                  <span>
                    Use <b>[VoiceName]</b> tags to switch voices.
                    <br />
                    Example: <code>[Felix] Hello. [Sarah] How are you?</code>
                    <br />
                    Available names: Felix, Sarah, Emily, etc.
                  </span>
                }
                placement="top"
              >
                <Typography.Text type="secondary" style={{ cursor: "pointer" }}>
                  How to use multi-voice? (hover for help)
                </Typography.Text>
              </Tooltip>
              {/* Error display for parse errors */}
              {parseErrors.length > 0 && (
                <div
                  style={{
                    background: "#fffbe6",
                    border: "1px solid #ffe58f",
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  <Typography.Text type="warning">
                    {parseErrors.map((err, i) => (
                      <div key={i}>⚠️ {err}</div>
                    ))}
                  </Typography.Text>
                </div>
              )}
              <Collapse style={{ margin: "12px 0" }} bordered={false}>
                <Collapse.Panel header="How to use Neuro TTS" key="2">
                  <ol style={{ paddingLeft: 18, margin: 0 }}>
                    <li>
                      Choose <b>Single Voice</b> or <b>Multi-Voice</b> mode
                      above.
                    </li>
                    <li>
                      In <b>Single Voice</b> mode, select a voice and enter your
                      text.
                    </li>
                    <li>
                      In <b>Multi-Voice</b> mode, use <code>[VoiceName]</code>{" "}
                      tags to switch voices mid-text. See the available tags
                      below.
                    </li>
                    <li>
                      Click <b>Generate</b> to synthesize speech. Progress will
                      be shown.
                    </li>
                    <li>Listen to the result or download the WAV file.</li>
                  </ol>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    All processing is local in your browser. For best results,
                    use short sentences and check the available voice tags.
                  </Typography.Text>
                </Collapse.Panel>
              </Collapse>
              <Collapse style={{ marginBottom: 8 }} bordered={false}>
                <Collapse.Panel header="Show Available Voice Tags" key="1">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 8,
                      maxHeight: 160,
                      overflowY: "auto",
                      background: "#fafafa",
                      borderRadius: 6,
                      border: "1px solid #eee",
                      padding: 8,
                    }}
                  >
                    {voiceData.map((v) => (
                      <div
                        key={v.name}
                        style={{ fontSize: 13, lineHeight: 1.3 }}
                      >
                        <code
                          style={{
                            background: "#f0f0f0",
                            borderRadius: 4,
                            padding: "1px 4px",
                            marginRight: 4,
                          }}
                        >
                          [{v.displayName.split(" ")[0]}]
                        </code>
                        <span>
                          {v.displayName.replace(/\(.+\)/, "").trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </Collapse.Panel>
              </Collapse>
            </>
          )}

          {/* Warn if input is very long */}
          {longTextWarning && (
            <div
              style={{
                background: "#fff1f0",
                border: "1px solid #ffa39e",
                borderRadius: 6,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <Typography.Text type="danger">
                ⚠️ Your input is very long. Generation may take a while and your
                browser may become temporarily unresponsive. For best results,
                use shorter paragraphs or split your text.
              </Typography.Text>
            </div>
          )}

          <TextArea
            rows={6}
            value={inputText}
            onChange={handleInputChange}
            placeholder={
              mode === "multi"
                ? "Enter text with [VoiceName] tags..."
                : "Enter text to convert to speech..."
            }
          />

          <Button
            type="primary"
            onClick={generateTTS}
            disabled={isLoading || !tts}
            loading={isLoading}
          >
            {isLoading
              ? "Generating..."
              : tts
              ? "Generate"
              : "Loading Model..."}
          </Button>

          {/* Generation Progress */}
          {isLoading && (
            <div style={{ width: "100%" }}>
              <Typography.Text
                style={{ display: "block", marginBottom: "8px" }}
              >
                Generating Audio
              </Typography.Text>
              <Progress
                percent={Math.round(generationProgress * 100)}
                status="active"
                size="small"
              />
            </div>
          )}

          {audioUrl && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <audio
                controls
                src={audioUrl}
                style={{ width: "100%", maxWidth: "100%" }}
              />
              <Button
                type="link"
                href={audioUrl}
                download="tts-output.wav"
                style={{ padding: 0 }}
              >
                Download WAV
              </Button>
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
}

export default App;
