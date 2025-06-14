# Neuro TTS - Neural Text-to-Speech Web Application

A modern, browser-based text-to-speech application that generates high-quality speech using neural voice models. Neuro TTS runs completely client-side, with no server required.

## Features

- **Client-Side Neural TTS**: Generate high-quality speech directly in your browser using [kokoro-js](https://www.npmjs.com/package/kokoro-js)
- **Multiple Voice Options**: Choose from 28 different voices across American and British English accents
- **Multi-Voice Mode**: Create dynamic audio with different voices using `[VoiceName]` tags
- **Unlimited Text Length**: Process texts of any length by automatically splitting and joining audio segments
- **Mobile Optimized**: Special optimizations for mobile devices with lower memory requirements
- **No Server Required**: All processing happens locally in your browser
- **Download as WAV**: Save generated audio as a standard WAV file

## Getting Started

### Online Demo

Visit [https://neurotts.app](https://neurotts.app) to try the application without installation.

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/web-tts.git
cd web-tts

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

## How to Use

### Single Voice Mode

1. Select a voice from the dropdown menu
2. Enter or paste your text in the input field
3. Click "Generate" to create audio
4. Use the audio player to listen or download the result

### Multi-Voice Mode

1. Switch to "Multi-Voice" mode using the toggle
2. Enter text with voice tags in the format: `[VoiceName] Text goes here`
3. Example: `[Felix] Hello there! [Sarah] Nice to meet you!`
4. Click "Generate" to create multi-voice audio
5. Use the audio player to listen or download the result

Available voice tags include Felix, Sarah, Emily, Daniel, and many more. Full list is available in the application.

## Command-Line Interface

Neuro TTS also includes a CLI tool for batch processing:

```bash
# Install globally
npm install -g .

# Basic usage
tts --text "Text to convert to speech" --output output.wav

# Use a specific voice
tts --text "Hello world" --voice af_heart --output hello.wav

# Process a text file
tts --file input.txt --output result.wav

# Multi-voice mode
tts --file script.txt --multi-voice --output dialogue.wav

# List all available voices
tts --list-voices

# Return JSON output with file link (useful for automation/integration)
tts --text "Hello world" --output hello.wav --json
# Output: {"status":"success","outputFile":"/absolute/path/to/hello.wav","duration":1.25}

# Include additional metadata in JSON output
tts --file input.txt --output result.wav --json --include-metadata
# Output: {"status":"success","outputFile":"/absolute/path/to/result.wav","duration":5.67,"metadata":{"voice":"af_heart","wordCount":120,"processingTime":2.3,"sampleRate":24000,"fileSize":548000}}

# JSON format for voice listing
tts --list-voices --json
# Returns structured data about all available voices
```

The JSON output makes it easy to integrate with automation tools like n8n, scripts, or other applications. The JSON response includes the absolute path to the generated audio file, making it convenient to use in workflows that need to reference the output file.

## Technical Details

- Built with React and TypeScript
- Uses Vite for fast development and optimized builds
- UI components from Ant Design
- Speech synthesis via KokoroTTS ONNX models (WebAssembly)
- Audio processing with wavefile library

## Browser Compatibility

- Chrome/Edge (recommended): Best performance
- Firefox: Good performance
- Safari: Compatible with some limitations
- Mobile browsers: Optimized with smaller models and chunk sizes

## Performance Considerations

- First load requires downloading the TTS model (approximately 80MB)
- Long texts will be automatically split into chunks for processing
- On mobile devices, shorter texts perform better
- Multi-voice mode with many voice changes may be slower on mobile devices

## License

MIT License (c) 2025 Neuro Techie

## Acknowledgments

- [KokoroTTS](https://github.com/CokoDev/Kokoro) for the neural TTS model
- [kokoro-js](https://www.npmjs.com/package/kokoro-js) for the JavaScript wrapper
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the web framework
- [Ant Design](https://ant.design/) for the UI components
