# Project Status: Neuro TTS Web App

## Current Status

- The app fully supports multi-voice, infinite-length TTS: parses [VoiceName] tags, splits text at natural breakpoints, synthesizes all segments sequentially, and concatenates audio for playback/download.
- Progress is shown for each chunk; debug logging is available via a code toggle.
- UI is clean and responsive (Ant Design), and now supports both single-voice and multi-voice modes via a toggle.
- In multi-voice mode, users see a help section and an accordion with available [VoiceName] tags for easy reference.

## Next Steps

- Improve error handling for unknown voices and empty segments.
- Optimize performance and user experience for very long texts.
- Continue to refine UX and polish for production readiness.

## Comments for Reprompt

- Multi-voice, infinite-length TTS and audio concatenation are implemented.
- Debug logs can be enabled in code (set `debugLogs = true` in App.tsx).
- UI improvements for multi-voice mode and user guidance are complete.
- Next, focus on error handling and UX/performance for long texts.
- Further UX and error handling improvements are recommended for production use.
