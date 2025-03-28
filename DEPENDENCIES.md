# VideoNova External Dependencies

This document outlines the external dependencies required for VideoNova to function properly.

## Automatically Managed Dependencies

The following dependencies are automatically installed and managed by the application:

- **FFmpeg**: Used for audio/video manipulation. The binary is included with the application via the `ffmpeg-static` package.
- **yt-dlp**: Used for downloading videos from various platforms. The binary is included with the application via the `yt-dlp-wrap` package.

## Python Dependencies

For certain AI features, Python 3.9+ and specific packages are required:

### Installation

1. **Install Python**:
   - macOS: `brew install python` or download from [python.org](https://www.python.org/downloads/)
   - Windows: Download and install from [python.org](https://www.python.org/downloads/)
   - Linux: Use your distribution's package manager (e.g., `apt install python3 python3-pip`)

2. **Verify Python Installation**:
   ```
   python --version  # or python3 --version on Linux/macOS
   ```

3. **Install Required Packages**:
   ```
   pip install demucs openai-whisper TTS  # (or pip3 on Linux/macOS)
   ```

### Required Python Packages

- **Demucs**: Used for vocal separation
  - Installation: `pip install demucs`
  - GitHub: [facebookresearch/demucs](https://github.com/facebookresearch/demucs)

- **Whisper**: Used for offline speech-to-text
  - Installation: `pip install openai-whisper`
  - GitHub: [openai/whisper](https://github.com/openai/whisper)

- **Fish Speech**: Used for offline text-to-speech
  - Installation: `pip install TTS`
  - GitHub: [mozilla/TTS](https://github.com/mozilla/TTS)

## Additional Dependencies

### SoundTouch

SoundTouch is used for audio timing adjustments.

- The application will look for SoundTouch in common locations
- You can manually set the path in the application settings

#### Manual Installation

- macOS: `brew install soundtouch`
- Linux: `apt install soundtouch`
- Windows: Download from [SoundTouch website](https://www.surina.net/soundtouch/download.html)

## Configuring Dependencies

In most cases, VideoNova will automatically detect installed dependencies. If a dependency cannot be found:

1. Open VideoNova
2. Go to Settings > Dependencies
3. For each dependency, you can:
   - Click "Auto-detect" to try automatic detection
   - Click "Browse" to manually select the path to the binary

## Troubleshooting

If you encounter issues with dependencies:

1. Ensure Python is in your system PATH
2. Check that you have the correct version of Python (3.9+)
3. Verify that pip packages are installed correctly
4. Check the application logs for specific error messages

## Development Setup

For developers working on VideoNova:

1. All Node.js dependencies are managed via npm
2. External dependencies follow the same setup process as for users
3. During development, the application will log warnings about missing dependencies
4. For testing Python integration, ensure Python and required packages are installed 