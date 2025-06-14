import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Alert,
} from "antd";
import "./App.css";
import "antd/dist/reset.css";
import { voiceData } from "./voice-data";

const { Title } = Typography;
const { TextArea } = Input;
interface TTSError extends Error {
  message: string;
}

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Web Worker
const createTTSWorker = () => {
  return new Worker(new URL("./ttsWorker.ts", import.meta.url), {
    type: "module",
  });
};

function App() {
  const [inputText, setInputText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [modelLoadingMessage, setModelLoadingMessage] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const [ttsReady, setTtsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const audioBuffersRef = useRef<{ [key: number]: Float32Array }>({});
  const sampleRateRef = useRef<number>(24000);
  const totalChunksRef = useRef<number>(0);
  const completedChunksRef = useRef<number>(0);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [mobileWarning, setMobileWarning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Adjust chunk size based on device
  const CHUNK_SIZE = isMobile ? 150 : 300;

  useEffect(() => {
    // Show mobile warning once
    if (isMobile && !mobileWarning) {
      setMobileWarning(true);
    }
  }, [mobileWarning]);

  // Warn user if input is very long
  // More conservative threshold for mobile
  const LONG_TEXT_THRESHOLD = isMobile ? 1000 : 2000;
  const [longTextWarning, setLongTextWarning] = useState(false);
  useEffect(() => {
    setLongTextWarning(inputText.length > LONG_TEXT_THRESHOLD);
  }, [inputText, LONG_TEXT_THRESHOLD]);

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

  useEffect(() => {
    // Initialize the worker
    const worker = createTTSWorker();
    workerRef.current = worker;

    // Handle messages from the worker
    worker.onmessage = (event) => {
      const data = event.data;

      switch (data.type) {
        case "progress":
          // Separate model loading progress from generation progress
          if (
            data.message.includes("Model") ||
            data.message.includes("Downloading") ||
            data.message.includes("Initializing")
          ) {
            setModelLoadingProgress(data.progress);
            setModelLoadingMessage(data.message);
          } else {
            setGenerationProgress(data.progress);
            setGenerationMessage(data.message);
          }
          break;
        case "result":
          // Store audio chunk
          audioBuffersRef.current[data.chunkIndex] = data.audio;
          sampleRateRef.current = data.samplingRate;
          completedChunksRef.current++;

          // Update progress
          setGenerationProgress(
            completedChunksRef.current / totalChunksRef.current
          );

          // If all chunks are done, concatenate and process
          if (completedChunksRef.current === totalChunksRef.current) {
            processCompletedAudio();
          }
          break;
        case "error":
          console.error("Worker error:", data.message);
          setLoadError(data.message);
          setIsLoading(false);
          break;
        default:
          console.warn("Unknown message from worker:", data);
      }
    };

    // Initialize the TTS model in the worker
    worker.postMessage({
      type: "init",
      modelId: "onnx-community/Kokoro-82M-v1.0-ONNX",
      dtype: isMobile ? "q4" : "q8", // Lower precision for mobile
      device: "wasm",
      isMobile: isMobile, // Pass mobile flag to worker
    });

    setIsLoading(true);
    setModelLoadingMessage("Initializing TTS model...");

    // Clean up worker on component unmount
    return () => {
      worker.terminate();
    };
  }, []);

  // Process completed audio chunks into a single WAV file
  const processCompletedAudio = useCallback(() => {
    try {
      const chunks = Object.values(audioBuffersRef.current);

      // Concatenate all Float32Array audio buffers
      const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
      const joined = new Float32Array(totalLength);
      let offset = 0;
      for (const arr of chunks) {
        joined.set(arr, offset);
        offset += arr.length;
      }

      // Convert to WAV
      const outputWav = new WaveFile();
      outputWav.fromScratch(
        1,
        sampleRateRef.current,
        "16",
        float32ToInt16(joined)
      );
      const wavBuffer = outputWav.toBuffer();
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const wavUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(wavUrl);

      // Reset for next generation
      audioBuffersRef.current = {};
      setIsLoading(false);
      setGenerationProgress(1);
    } catch (error: unknown) {
      const ttsError = error as TTSError;
      const errorMessage = ttsError.message || "Unknown error occurred";
      console.error("Error processing audio:", ttsError);
      alert(
        `Error processing audio: ${errorMessage}. Please check the console for details.`
      );
      setIsLoading(false);
    }
  }, []);

  // Update TTS ready state when model loading completes
  useEffect(() => {
    if (modelLoadingProgress === 1) {
      setTtsReady(true);
      setIsLoading(false);
    }
  }, [modelLoadingProgress]);

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
    if (!workerRef.current || !ttsReady) {
      alert("TTS model is still loading. Please wait.");
      return;
    }

    if (!inputText.trim()) {
      alert("Please enter some text to convert to speech.");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
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

      // On mobile, use smaller chunks
      let allChunks: { voice: VoiceOption; text: string }[] = [];
      for (const seg of segments) {
        // Use mobile-optimized chunk size
        const splits = splitTextAtBreaks(seg.text, CHUNK_SIZE);
        for (const chunk of splits) {
          allChunks.push({ voice: seg.voice, text: chunk });
        }
      }

      // For mobile devices with very long texts, warn and potentially limit
      if (isMobile && allChunks.length > 10) {
        const proceed = window.confirm(
          `This text will be split into ${allChunks.length} chunks, which may cause performance issues on mobile devices. Continue anyway?`
        );

        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }
      if (debugLogs) console.log("[TTS] All chunks for synthesis:", allChunks);

      // Reset tracking variables
      audioBuffersRef.current = {};
      totalChunksRef.current = allChunks.length;
      completedChunksRef.current = 0;

      // Mobile optimization: Process chunks in smaller batches to avoid memory issues
      const processChunks = async (startIdx: number, batchSize: number) => {
        const endIdx = Math.min(startIdx + batchSize, allChunks.length);

        for (let i = startIdx; i < endIdx; i++) {
          const { voice, text } = allChunks[i];
          workerRef.current?.postMessage({
            type: "generate",
            text,
            voice,
            chunkIndex: i,
            totalChunks: allChunks.length,
          });

          // On mobile, add a small delay between sending chunks to avoid overloading
          if (isMobile && i < endIdx - 1) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      };

      // Process initial batch (all for desktop, smaller batch for mobile)
      const initialBatchSize = isMobile ? 3 : allChunks.length;
      await processChunks(0, initialBatchSize);

      // For mobile, set up batch processing for remaining chunks
      if (isMobile && allChunks.length > initialBatchSize) {
        let currentIdx = initialBatchSize;

        // Set up an interval to check when we can process more chunks
        const processingInterval = setInterval(() => {
          // If we've received results for at least half of what we've sent, send more
          if (
            completedChunksRef.current >= currentIdx / 2 &&
            currentIdx < allChunks.length
          ) {
            processChunks(currentIdx, 2); // Process 2 more chunks
            currentIdx += 2;
          }

          // Stop the interval when all chunks are being processed
          if (currentIdx >= allChunks.length) {
            clearInterval(processingInterval);
          }
        }, 1000);
      }
    } catch (error: unknown) {
      const ttsError = error as TTSError;
      const errorMessage = ttsError.message || "Unknown error occurred";
      console.error("Error generating TTS:", ttsError);
      setLoadError(`Error generating TTS: ${errorMessage}`);
      setIsLoading(false);
    }
  }, [inputText, ttsReady, selectedVoice, debugLogs, CHUNK_SIZE]);

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

          {/* Mobile warning banner */}
          {isMobile && mobileWarning && (
            <Alert
              message="Mobile Device Detected"
              description="For best performance, use shorter texts and avoid multi-voice mode with many voice changes. The app has been optimized for mobile, but may still be slower than on desktop."
              type="info"
              showIcon
              closable
              onClose={() => setMobileWarning(false)}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Error display */}
          {loadError && (
            <Alert
              message="Error"
              description={loadError}
              type="error"
              showIcon
              closable
              onClose={() => setLoadError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

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

          {/* Model Loading Progress - only show when model is loading */}
          {!ttsReady && modelLoadingProgress < 1 && (
            <div style={{ width: "100%" }}>
              <Typography.Text
                style={{ display: "block", marginBottom: "8px" }}
              >
                {modelLoadingMessage ||
                  (modelLoadingProgress < 0.9
                    ? "Downloading Model"
                    : "Initializing Model")}
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
              // Limit displayed voices on mobile to reduce dropdown size
              options={voiceData
                .filter((voice) =>
                  isMobile
                    ? ["A", "B"].includes(voice.overallGrade.charAt(0)) // Only A and B voices on mobile
                    : ["A", "B", "C"].includes(voice.overallGrade.charAt(0))
                )
                .map((voice) => ({
                  label: voice.displayName,
                  value: voice.name,
                }))}
            />
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

              {/* Simplified collapsible sections on mobile */}
              {isMobile ? (
                <Collapse style={{ margin: "12px 0" }} bordered={false}>
                  <Collapse.Panel header="Help & Voice Tags" key="mobile">
                    <Typography.Text strong>How to use:</Typography.Text>
                    <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                      <li>
                        Enter text with voice tags like [Felix] or [Sarah]
                      </li>
                      <li>Keep sentences short for better performance</li>
                      <li>Available tags: Felix, Sarah, Emily, Daniel, etc.</li>
                    </ul>
                  </Collapse.Panel>
                </Collapse>
              ) : (
                // Desktop view with separate collapsible sections
                <>
                  <Collapse style={{ margin: "12px 0" }} bordered={false}>
                    <Collapse.Panel header="How to use Neuro TTS" key="2">
                      <ol style={{ paddingLeft: 18, margin: 0 }}>
                        <li>
                          Choose <b>Single Voice</b> or <b>Multi-Voice</b> mode
                          above.
                        </li>
                        <li>
                          In <b>Single Voice</b> mode, select a voice and enter
                          your text.
                        </li>
                        <li>
                          In <b>Multi-Voice</b> mode, use{" "}
                          <code>[VoiceName]</code> tags to switch voices
                          mid-text. See the available tags below.
                        </li>
                        <li>
                          Click <b>Generate</b> to synthesize speech. Progress
                          will be shown.
                        </li>
                        <li>Listen to the result or download the WAV file.</li>
                      </ol>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                      >
                        All processing is local in your browser. For best
                        results, use short sentences and check the available
                        voice tags.
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
            rows={isMobile ? 4 : 6}
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
            disabled={isLoading || !ttsReady}
            loading={isLoading}
            size={isMobile ? "large" : "middle"}
            block={isMobile}
          >
            {isLoading
              ? "Generating..."
              : ttsReady
              ? "Generate"
              : "Loading Model..."}
          </Button>

          {/* Generation Progress - only show during active generation */}
          {isLoading && ttsReady && (
            <div style={{ width: "100%" }}>
              <Typography.Text
                style={{ display: "block", marginBottom: "8px" }}
              >
                {generationMessage || "Generating Audio"}
              </Typography.Text>
              <Progress
                percent={Math.min(100, Math.round(generationProgress * 100))}
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
