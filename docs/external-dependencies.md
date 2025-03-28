# External Dependencies

This document outlines the external dependencies required for the VideoNova application, focusing on command-line tools and Python packages that need to be installed separately.

## Demucs (Audio Source Separation)

Demucs is used for separating vocals from instrumental tracks in audio files.

### Requirements

- **Python**: Version 3.8 or higher
- **Python Packages**:
  - `demucs` (Latest version recommended)
  - `torch` (Required by Demucs)

### Installation

1. **Install Python**:
   - Windows: Download from [python.org](https://www.python.org/downloads/)
   - macOS: `brew install python` or download from python.org
   - Linux: Use your distribution's package manager (e.g., `apt install python3`)

2. **Install Demucs**:
   ```bash
   # Basic installation
   pip install demucs

   # Or with specific version
   pip install demucs==4.0.0  # Adjust version as needed
   ```

3. **Verify Installation**:
   ```bash
   python -m demucs --help
   ```

### Configuration

By default, the application looks for Python at:
- Windows: `python`
- macOS/Linux: `python3`

You can specify a custom Python path in the application settings if needed.

## SoundTouch (Audio Timing Adjustment)

SoundTouch is used for adjusting the timing/speed of audio files without affecting pitch.

### Requirements

- **soundstretch**: Command-line tool from the SoundTouch library

### Installation

#### Windows
1. Download the latest SoundTouch package from [the official website](https://www.surina.net/soundtouch/)
2. Extract the package and locate the `soundstretch.exe` file
3. Either add its location to your PATH or configure the path in the application settings

#### macOS
```bash
# Using Homebrew
brew install soundtouch
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install soundtouch

# Fedora
sudo dnf install soundtouch
```

### Verification

To verify installation, run:
```bash
soundstretch --help
```

## Important Notes

- The application expects these tools to be accessible via command line
- If tools are not found in the default locations, you will be prompted to provide their paths
- Future versions may include bundled versions of these dependencies for easier setup 