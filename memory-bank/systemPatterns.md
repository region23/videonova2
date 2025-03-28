# System Patterns

## Architecture Overview

VideoNova uses a layered architecture with the following components:

```
┌────────────────────────────────────────────────────┐
│                  Electron Shell                    │
├─────────────────┐                ┌─────────────────┤
│                 │                │                 │
│   React UI      │                │   Node.js       │
│   (Frontend)    │                │   Backend       │
│                 │                │                 │
├─────────────────┘                └─────────────────┤
│                    IPC Bridge                      │
├────────────────────────────────────────────────────┤
│                 External Services                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │
│ │ yt-dlp  │ │ ffmpeg  │ │ Demucs  │ │ Soundtouch │ │
│ └─────────┘ └─────────┘ └─────────┘ └────────────┘ │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │
│ │ OpenAI  │ │ Whisper │ │  Vosk   │ │Fish Speech │ │
│ └─────────┘ └─────────┘ └─────────┘ └────────────┘ │
└────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Process Orchestration
The system uses an **Orchestrator** pattern to manage the video processing pipeline. This central controller:
- Coordinates the execution of individual processing steps
- Manages state transitions
- Provides progress reporting
- Handles error conditions and recovery
- Implements the workflow as a series of asynchronous steps

### 2. Wrappers and Adapters
Each external dependency is encapsulated behind a wrapper/adapter interface:
- **Command Adapters**: For CLI tools (yt-dlp, ffmpeg, Demucs, Soundtouch)
- **API Clients**: For web services (OpenAI API)
- **Local Model Adapters**: For offline processing models (Whisper, Vosk, Fish Speech, Ollama)

This pattern provides:
- Consistent error handling
- Progress reporting
- Abstraction of implementation details
- Easy switching between different implementations (e.g., online vs. offline)

### 3. Event-Driven Communication
The application uses an event-driven approach for:
- IPC between Electron main and renderer processes
- Progress reporting from long-running processes
- Asynchronous notification of state changes
- User interface updates

### 4. Strategy Pattern
The application implements the Strategy pattern for:
- Speech-to-text processing (OpenAI API vs. local Whisper/Vosk)
- Translation (OpenAI API vs. local Ollama)
- Text-to-speech (OpenAI API vs. local Fish Speech)

This allows runtime selection of processing strategies based on user preferences and availability.

### 5. Repository Pattern
Configuration and settings use a Repository pattern:
- Abstraction over storage mechanism (electron-store)
- Secure storage of sensitive data (API keys)
- Persistence of user preferences
- Caching of intermediate results

## Data Flow

The core processing pipeline follows this data flow:

1. **Input**: Video URL → Downloaded video/audio files
2. **Processing**:
   - If subtitles absent by URL do this: Audio extraction → Speech recognition → Original text (VTT)
   - Original text → Translation → Translated text (VTT)
   - Translated text → Speech synthesis → Translated audio
   - (Optional) Original audio → Vocal/Instrumental separation
3. **Output**: Original video + Translated audio (+ Instrumental audio) → Final video

## Component Relationships

- **UI Components**: React components communicate with backend via IPC
- **Backend Services**: Node.js modules wrap external tools and APIs
- **Orchestrator**: Coordinates the entire process flow
- **Configuration Manager**: Handles settings, API keys, and preferences
- **Dependency Manager**: Ensures required tools are available 