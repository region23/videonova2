# Technical Context

## Core Technologies

### Frontend
- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building component-based interfaces
- **TypeScript**: Typed superset of JavaScript for improved development
- **Vite**: Next-generation frontend build tool
- **Ant Design v5**: UI component library

### Backend
- **Node.js v22.x**: JavaScript runtime
- **Electron IPC**: Communication between frontend and backend

## External Dependencies

### Media Processing Tools
- **yt-dlp**: Command-line tool for downloading videos from YouTube and other platforms
  - Features: Format selection, subtitle download, playlist support
  - Usage: Video/audio acquisition

- **ffmpeg**: Multimedia framework for processing audio and video
  - Features: Conversion, extraction, mixing, encoding
  - Usage: Media manipulation, audio extraction, final video production

- **Demucs**: Source separation tool for isolating vocals from music
  - Features: Neural network-based audio source separation
  - Usage: Separating vocals from instrumental tracks for better dubbing

- **Soundtouch**: Audio processing library
  - Features: Time stretching and pitch shifting
  - Usage: Adjusting synthesized speech timing to match original content

### AI Models and Services

#### Online Services
- **OpenAI API**:
  - **Whisper API**: Cloud-based speech recognition
  - **GPT-4o-mini/o3-mini**: Text translation
  - **TTS API**: Speech synthesis

#### Offline/Local Models
- **Whisper (local)**: Open-source speech recognition model
- **Vosk**: Offline speech recognition toolkit
- **Ollama**: Local large language model runner
  - Usage: Text translation without internet access
- **Fish Speech**: Open-source text-to-speech synthesis

## Development Environment

### Build Tools
- **Vite**: Frontend bundling and development server
- **TypeScript Compiler**: Static type checking
- **electron-builder/electron-forge**: Application packaging and distribution

### Package Management
- **npm/yarn**: Dependency management
- **electron-store**: Settings storage
- **keytar (optional)**: Secure credential storage

## Technical Constraints

### Cross-Platform Compatibility
- Must work on Windows, macOS, and Linux
- Native dependencies (ffmpeg, etc.) must be available for all platforms

### Performance
- Heavy processing (Demucs, STT, TTS) can be resource-intensive
- UI must remain responsive during processing

### Security
- API keys must be stored securely
- Downloaded content must be handled responsibly

### Connectivity
- Must support both online (preferred) and offline operation
- Graceful fallback to offline models when needed

## Development Setup

To develop VideoNova, the following setup is required:

- Node.js v22.x
- npm or yarn
- Development environment for Electron (includes Chromium DevTools)
- ffmpeg installed and available in PATH (for development)
- Python environment (for Demucs, Whisper local)
- Sufficient disk space for dependencies and models 