# Project Overview: Neuro TTS Web App

## Description

Neuro TTS is a web-based Text-to-Speech (TTS) application built with React, TypeScript, and Vite. It allows users to input text, select from a variety of neural voices, and generate high-quality speech audio directly in the browser. The app uses the KokoroTTS ONNX model (via the `kokoro-js` library) to perform TTS inference client-side, and provides a modern, responsive UI using Ant Design (antd).

## Features

- **Text-to-Speech**: Converts user-input text to speech using neural TTS models.
- **Voice Selection**: Choose from a curated list of American and British English voices (male and female, with quality ratings).
- **Progress Feedback**: Shows progress bars for model loading and audio generation.
- **Audio Playback & Download**: Listen to generated speech and download as a WAV file.
- **Responsive UI**: Clean, mobile-friendly interface using Ant Design components.

## Architecture & Technologies

- **Frontend Framework**: React 18 (with functional components and hooks)
- **TypeScript**: For type safety and modern development experience
- **Build Tool**: Vite (for fast development and optimized builds)
- **UI Library**: Ant Design (antd)
- **TTS Engine**: [kokoro-js](https://www.npmjs.com/package/kokoro-js) (runs ONNX TTS models in-browser via WebAssembly)
- **Audio Processing**: [wavefile](https://www.npmjs.com/package/wavefile) (for WAV encoding)

## How It Works

1. **Model Loading**: On first load, the app downloads and initializes the Kokoro-82M-v1.0-ONNX TTS model in the browser (using WebAssembly for performance). Progress is shown to the user.
2. **Text Input & Voice Selection**: User enters text and selects a voice from a dropdown (filtered for quality voices).
3. **TTS Generation**: On clicking "Generate", the app uses the loaded model to synthesize speech for the input text and selected voice.
4. **Audio Output**: The generated audio is encoded as a WAV file and made available for playback and download.

## Main Dependencies

- `react`, `react-dom`: UI framework
- `kokoro-js`: Loads and runs the ONNX TTS model in-browser
- `wavefile`: Encodes raw audio to WAV format
- `antd`: UI components
- `vite`: Build tool

## Project Structure

- `src/App.tsx`: Main application logic and UI
- `src/main.tsx`: Entry point, renders the App
- `src/App.css`, `src/index.css`: Styling
- `vite.config.ts`: Vite configuration
- `package.json`: Project metadata and dependencies

## Development & Build

- **Start Dev Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Lint**: `npm run lint`

## License

MIT License (c) 2025 Neuro Techie

---

### Notes

- All TTS runs locally in the browser; no backend or cloud API is required.
- The app is suitable for demos, prototyping, and offline TTS use-cases.
- For best results, use a modern browser with good WebAssembly support.

## Roadmap: Multi-Voice & Infinite Length TTS

### Phase 1: Text Parsing & Voice Tagging

- Parse input text for `[VoiceName]` tags (e.g., `[Felix] Hello [Sarah] How are you?`).
- Map tags to available voices.
- Split text into segments, each with its associated voice.

### Phase 2: Infinite Length Handling

- Implement logic to split long segments at natural breakpoints (e.g., sentence boundaries, punctuation).
- Process each segment sequentially, generating audio for each.
- Concatenate all audio segments into a single WAV output.

### Phase 3: UI Enhancements

- Add a toggle for "Single Voice" (current dropdown) and "Multiple Voice" (tag-based) modes.
- In "Multiple Voice" mode, show a help tooltip or example for the `[VoiceName]` syntax.
- Keep the UI clean: only show relevant controls for the selected mode.

### Phase 4: Audio Concatenation

- After generating audio for all segments, join them into one WAV file using the wavefile library.
- Provide playback and download for the final output.

### Phase 5: User Experience

- Show progress for each segment and overall generation.
- Handle errors gracefully (e.g., unknown voice tags, empty segments).
- Ensure the app remains responsive for long texts.

## New Requirements

- Support for multi-voice TTS using `[VoiceName]` syntax in the input text.
- Infinite length TTS by splitting and joining audio segments.
- UI toggle for single voice (dropdown) and multiple voice (tag-based) modes.
- Clean, easy-to-use interface for both modes.
