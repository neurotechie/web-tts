#!/usr/bin/env node
import { KokoroTTS } from "kokoro-js";
import pkg from "wavefile";
const { WaveFile } = pkg;
import fs from "fs/promises";
import path from "path";
import { program } from "commander";
import readline from "readline";

// Version number for the CLI tool
const VERSION = "1.0.0";

// Available voices - matches the web app's voice list
const voiceData = [
  { name: "am_fenrir", displayName: "Felix (American Male)" },
  { name: "af_heart", displayName: "Sarah (American Female)" },
  { name: "af_alloy", displayName: "Emily (American Female)" },
  { name: "af_aoede", displayName: "Madison (American Female)" },
  { name: "af_bella", displayName: "Bella (American Female)" },
  { name: "af_jessica", displayName: "Jessica (American Female)" },
  { name: "af_kore", displayName: "Kora (American Female)" },
  { name: "af_nicole", displayName: "Nicole (American Female)" },
  { name: "af_nova", displayName: "Nova (American Female)" },
  { name: "af_river", displayName: "River (American Female)" },
  { name: "af_sarah", displayName: "Laura (American Female)" },
  { name: "af_sky", displayName: "Skylar (American Female)" },
  { name: "am_adam", displayName: "Adam (American Male)" },
  { name: "am_echo", displayName: "Ethan (American Male)" },
  { name: "am_eric", displayName: "Eric (American Male)" },
  { name: "am_liam", displayName: "Liam (American Male)" },
  { name: "am_michael", displayName: "Michael (American Male)" },
  { name: "am_onyx", displayName: "Oliver (American Male)" },
  { name: "am_puck", displayName: "Peter (American Male)" },
  { name: "am_santa", displayName: "Nick (American Male)" },
  { name: "bf_alice", displayName: "Alice (British Female)" },
  { name: "bf_emma", displayName: "Emma (British Female)" },
  { name: "bf_isabella", displayName: "Isabella (British Female)" },
  { name: "bf_lily", displayName: "Lily (British Female)" },
  { name: "bm_daniel", displayName: "Daniel (British Male)" },
  { name: "bm_fable", displayName: "Frederick (British Male)" },
  { name: "bm_george", displayName: "George (British Male)" },
  { name: "bm_lewis", displayName: "Lewis (British Male)" },
];

// Helper: Map display names to internal voice names (lowercase)
const displayNameToVoice = Object.fromEntries(
  voiceData.map((v) => [v.displayName.split(" ")[0].toLowerCase(), v.name])
);

// Helper: Set of valid tag names for quick lookup
const validTagNames = new Set(
  voiceData.map((v) => v.displayName.split(" ")[0].toLowerCase())
);

// Helper: Convert Float32Array to Int16Array for WAV file
const float32ToInt16 = (buffer) => {
  const l = buffer.length;
  const result = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return result;
};

// Helper: Split text at sentence breaks to prevent too long chunks
const splitTextAtBreaks = (text, maxLen = 300) => {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
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

// Helper: Parse text for [VoiceName] tags and split into segments
function parseMultiVoiceText(text, defaultVoice) {
  const regex = /\[([A-Za-z]+)\]/g;
  let result = [];
  let errors = [];
  let lastIndex = 0;
  let match;
  let currentVoice = defaultVoice;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segText = text.slice(lastIndex, match.index).trim();
      if (segText.length > 0) {
        result.push({ voice: currentVoice, text: segText });
      } else {
        errors.push(`Empty segment before [${match[1]}] tag will be skipped.`);
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
      currentVoice = mappedVoice;
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

// Helper: Calculate audio duration in seconds based on sample rate and data length
const calculateDuration = (audioLength, sampleRate) => {
  return audioLength / sampleRate;
};

// Helper: Get absolute path for output file
const getAbsolutePath = (filePath) => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(process.cwd(), filePath);
};

// Setup command line options
program
  .name("cli-tts")
  .description("CLI Text-to-Speech using Kokoro TTS")
  .version(VERSION)
  .option("-t, --text <text>", "Text to synthesize")
  .option("-f, --file <path>", "Path to a text file to synthesize")
  .option("-o, --output <path>", "Output WAV file path", "output.wav")
  .option(
    "-v, --voice <voice>",
    "Voice to use (default: am_fenrir)",
    "am_fenrir"
  )
  .option("-m, --multi-voice", "Enable multi-voice mode with [VoiceName] tags")
  .option("-l, --list-voices", "List available voices")
  .option(
    "-c, --chunk-size <size>",
    "Maximum chunk size for text splitting",
    "300"
  )
  .option("-d, --debug", "Enable debug output")
  .option("-j, --json", "Output JSON response instead of text")
  .option("--include-metadata", "Include additional metadata in JSON output")
  .parse(process.argv);

const opts = program.opts();

// Main function
async function main() {
  // List voices and exit if requested
  if (opts.listVoices) {
    if (opts.json) {
      console.log(JSON.stringify({ 
        status: "success", 
        voices: voiceData 
      }));
    } else {
      console.log("Available voices:");
      voiceData.forEach((v) => {
        console.log(`  ${v.name} - ${v.displayName}`);
      });
      console.log("\nIn multi-voice mode, use tags like [Felix], [Sarah], etc.");
    }
    return;
  }

  // Check if we have text to synthesize
  let text = "";
  if (opts.text) {
    text = opts.text;
  } else if (opts.file) {
    try {
      text = await fs.readFile(opts.file, "utf-8");
    } catch (error) {
      if (opts.json) {
        console.log(JSON.stringify({
          status: "error",
          error: `Error reading file: ${error.message}`
        }));
      } else {
        console.error(`Error reading file: ${error.message}`);
      }
      return;
    }
  } else {
    // If no text provided, read from stdin if data is being piped in
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      for await (const line of rl) {
        text += line + "\n";
      }
    } else {
      if (opts.json) {
        console.log(JSON.stringify({
          status: "error",
          error: "No text input provided. Use --text, --file options or pipe text."
        }));
      } else {
        console.error(
          "Error: No text input provided. Use --text, --file options or pipe text."
        );
        program.help();
      }
      return;
    }
  }

  if (!text.trim()) {
    if (opts.json) {
      console.log(JSON.stringify({
        status: "error",
        error: "Empty text input."
      }));
    } else {
      console.error("Error: Empty text input.");
    }
    return;
  }

  if (opts.debug && !opts.json) {
    console.log(
      "Text to synthesize:",
      text.slice(0, 100) + (text.length > 100 ? "..." : "")
    );
  }

  // Track start time for performance metrics
  const startTime = Date.now();
  
  // Initialize TTS
  if (!opts.json) {
    console.log("Initializing TTS model...");
  }
  
  const tts = await KokoroTTS.from_pretrained(
    "onnx-community/Kokoro-82M-v1.0-ONNX",
    {
      dtype: "q8",
      device: "cpu",
      progress_callback: (progressInfo) => {
        if ("progress" in progressInfo && !opts.json) {
          const percent = Math.round(progressInfo.progress * 100);
          process.stdout.write(`\rDownloading model: ${percent}%`);
        }
      },
    }
  );

  if (!opts.json) {
    console.log("\nModel loaded successfully!");
  }

  let allAudioChunks = [];
  let sampleRate = 24000; // Default sample rate
  const processingErrors = [];
  const processingWarnings = [];
  
  try {
    // Parse input based on mode
    if (opts.multiVoice) {
      if (!opts.json) {
        console.log("Multi-voice mode enabled");
      }
      
      const { segments, errors } = parseMultiVoiceText(text, opts.voice);

      if (errors.length > 0) {
        errors.forEach(err => processingWarnings.push(err));
        
        if (!opts.json) {
          console.log("Warnings:");
          errors.forEach((err) => console.log(` - ${err}`));
        }
      }

      if (segments.length === 0) {
        const errorMsg = "No valid text segments found to synthesize.";
        
        if (opts.json) {
          console.log(JSON.stringify({
            status: "error",
            error: errorMsg
          }));
        } else {
          console.error(`Error: ${errorMsg}`);
        }
        return;
      }

      let allChunks = [];
      for (const seg of segments) {
        const splits = splitTextAtBreaks(seg.text, parseInt(opts.chunkSize));
        for (const chunk of splits) {
          allChunks.push({ voice: seg.voice, text: chunk });
        }
      }

      if (!opts.json) {
        console.log(`Processing ${allChunks.length} text chunks...`);
      }

      // Process each chunk
      for (let i = 0; i < allChunks.length; i++) {
        const { voice, text } = allChunks[i];
        if (!opts.json) {
          process.stdout.write(
            `\rGenerating chunk ${i + 1}/${allChunks.length}...`
          );
        }

        const result = await tts.generate(text, { voice });
        sampleRate = result.sampling_rate;
        allAudioChunks.push(result.audio);
      }
    } else {
      if (!opts.json) {
        console.log("Single voice mode with:", opts.voice);
      }
      
      const chunks = splitTextAtBreaks(text, parseInt(opts.chunkSize));

      if (!opts.json) {
        console.log(`Processing ${chunks.length} text chunks...`);
      }

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        if (!opts.json) {
          process.stdout.write(`\rGenerating chunk ${i + 1}/${chunks.length}...`);
        }

        const result = await tts.generate(chunks[i], { voice: opts.voice });
        sampleRate = result.sampling_rate;
        allAudioChunks.push(result.audio);
      }
    }

    if (!opts.json) {
      console.log("\nCombining audio chunks...");
    }

    // Concatenate all audio buffers
    const totalLength = allAudioChunks.reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    const joined = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of allAudioChunks) {
      joined.set(arr, offset);
      offset += arr.length;
    }

    // Convert to WAV
    const outputWav = new WaveFile();
    outputWav.fromScratch(1, sampleRate, "16", float32ToInt16(joined));
    const wavBuffer = outputWav.toBuffer();

    // Calculate duration
    const duration = calculateDuration(joined.length, sampleRate);
    
    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;

    // Get absolute path
    const outputPath = getAbsolutePath(opts.output);
    
    // Write to file
    await fs.writeFile(opts.output, Buffer.from(wavBuffer));
    
    // Output response based on format
    if (opts.json) {
      const response = {
        status: "success",
        outputFile: outputPath,
        duration: parseFloat(duration.toFixed(2))
      };
      
      // Add optional metadata if requested
      if (opts.includeMetadata) {
        response.metadata = {
          voice: opts.multiVoice ? "multiple" : opts.voice,
          wordCount: text.split(/\s+/).length,
          processingTime: parseFloat(processingTime.toFixed(2)),
          sampleRate: sampleRate,
          fileSize: wavBuffer.length,
          warnings: processingWarnings.length > 0 ? processingWarnings : undefined
        };
      }
      
      console.log(JSON.stringify(response));
    } else {
      console.log(`Audio successfully saved to: ${opts.output}`);
    }
  } catch (error) {
    if (opts.json) {
      console.log(JSON.stringify({
        status: "error",
        error: `Failed to generate speech: ${error.message}`
      }));
    } else {
      console.error(`Error generating TTS: ${error.message}`);
    }
  }
}

main().catch((err) => {
  if (opts.json) {
    console.log(JSON.stringify({
      status: "error",
      error: `Unhandled error: ${err.message}`
    }));
  } else {
    console.error("Unhandled error:", err);
  }
});
