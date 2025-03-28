Okay, let's outline the detailed steps for **Phase 0: Initialization** and **Phase 1: Backend Integration**, incorporating best practices anticipated for early 2025.

---

## Phase 0: Project Initialization (Detailed Plan)

**Goal:** Establish the foundational project structure, integrate core technologies (Electron, React, Vite, TypeScript), set up the development environment, and create basic communication pathways.

**Best Practices Focus (Jan 2025):**
*   **Tooling:** Leverage Vite for fast frontend builds, Electron Forge for integrated Electron tooling.
*   **Language:** Strict TypeScript everywhere.
*   **Architecture:** Enforce `contextIsolation`, use preload scripts diligently for security.
*   **IPC:** Establish typed and secure IPC from the start.
*   **UI:** Modern component library (Ant Design v5).
*   **Code Quality:** Integrate ESLint/Prettier early.

---

**Step 0.1: Initialize Project Structure with Vite + React + TypeScript**

*   **Goal:** Create the core frontend application structure.
*   **Tasks:**
    1.  Use Vite to scaffold a new project: `npm create vite@latest videonova --template react-ts` (or yarn equivalent).
    2.  Navigate into the `videonova` directory.
    3.  Install basic dependencies: `npm install` (or `yarn`).
    4.  Verify the basic React app runs: `npm run dev`.
    5.  Organize folders: Create `src/renderer`, `src/main`, `src/preload`, `src/shared` directories. Move initial Vite `src` content into `src/renderer`.
    6.  Configure TypeScript (`tsconfig.json`): Ensure strict mode (`"strict": true`), set up path aliases (`"paths": { "@renderer/*": ["./src/renderer/*"], ... }`) for cleaner imports. Adjust `tsconfig.node.json` for main/preload processes if needed.
*   **Tools:** Vite, React, TypeScript, npm/yarn.
*   **Outcome:** A basic, runnable React+TS application managed by Vite, with a structured directory layout.

---

**Step 0.2: Integrate Electron Framework using Electron Forge**

*   **Goal:** Convert the Vite project into an Electron application.
*   **Tasks:**
    1.  Install Electron and Electron Forge: `npm install --save-dev electron @electron-forge/cli`
    2.  Import Forge into the project: `npx electron-forge import` (This will set up `forge.config.js` and add necessary scripts to `package.json`).
    3.  Install Forge plugins/makers if needed (e.g., Vite plugin): `npm install --save-dev @electron-forge/plugin-vite`.
    4.  Configure `forge.config.js`:
        *   Specify the Vite plugin for bundling renderer code.
        *   Define entry points for `main` (`src/main/index.ts`) and `preload` (`src/preload/index.ts`).
        *   Configure makers for target platforms (win, mac, linux).
    5.  Create the main process entry point (`src/main/index.ts`):
        *   Basic `BrowserWindow` creation.
        *   Crucially set `webPreferences: { contextIsolation: true, preload: path.join(__dirname, '../preload/index.js') }`. (Note: Forge might handle path resolution, adjust as needed).
        *   Load the renderer URL (development: Vite dev server, production: `index.html` from build output). Use conditional logic (`if (process.env.NODE_ENV === 'development') ...`).
    6.  Create the preload script entry point (`src/preload/index.ts`). It will be initially empty or contain basic `contextBridge` setup.
*   **Tools:** Electron, Electron Forge, `@electron-forge/plugin-vite`.
*   **Considerations:** Ensure correct path handling for preload script and renderer URL in both dev and prod modes. Understand Forge's build process.
*   **Outcome:** The React app now runs inside an Electron window. Forge build/package commands are functional.

---

**Step 0.3: Establish Typed IPC Communication**

*   **Goal:** Create a secure and type-safe channel for communication between the Renderer (React UI) and Main (Node.js backend) processes.
*   **Tasks:**
    1.  Define shared types/interfaces in `src/shared/ipc-types.ts` for channel names and payload structures.
        ```typescript
        // src/shared/ipc-types.ts
        export interface IElectronAPI {
          getAppVersion: () => Promise<string>;
          // Add more methods as needed
        }

        export const Channels = {
          GET_APP_VERSION: 'ipc:get-app-version',
        } as const; // Use const assertion for type safety
        ```
    2.  Implement the preload script (`src/preload/index.ts`):
        *   Import `ipcRenderer` and `contextBridge` from `electron`.
        *   Import shared types/channels.
        *   Expose specific functions to the renderer via `contextBridge.exposeInMainWorld`:
            ```typescript
            // src/preload/index.ts
            import { contextBridge, ipcRenderer } from 'electron';
            import { Channels, IElectronAPI } from '../shared/ipc-types';

            contextBridge.exposeInMainWorld('electronAPI', {
              getAppVersion: () => ipcRenderer.invoke(Channels.GET_APP_VERSION),
              // Expose other methods here
            } as IElectronAPI);
            ```
    3.  Implement handlers in the main process (`src/main/index.ts`):
        *   Import `ipcMain` and `app` from `electron`.
        *   Import shared channels.
        *   Use `ipcMain.handle` for request-response channels:
            ```typescript
            // src/main/index.ts
            import { ipcMain, app } from 'electron';
            import { Channels } from '../shared/ipc-types';

            ipcMain.handle(Channels.GET_APP_VERSION, () => {
              return app.getVersion();
            });
            // Add other handlers
            ```
    4.  Declare the exposed API in the renderer's global scope (`src/renderer/preload.d.ts` or similar):
        ```typescript
        // src/renderer/preload.d.ts
        import { IElectronAPI } from '../shared/ipc-types';

        declare global {
          interface Window {
            electronAPI: IElectronAPI;
          }
        }
        ```
    5.  Use the exposed API in React components (`src/renderer/App.tsx`):
        ```typescript
        // src/renderer/App.tsx
        import React, { useState, useEffect } from 'react';

        function App() {
          const [version, setVersion] = useState('');
          useEffect(() => {
            window.electronAPI.getAppVersion().then(setVersion);
          }, []);
          return <div>App Version: {version}</div>;
        }
        export default App;
        ```
*   **Tools:** Electron (ipcMain, ipcRenderer, contextBridge), TypeScript.
*   **Best Practice:** Use `invoke/handle` for request/response. Use `send/on` for events/notifications (e.g., progress updates). Strictly type all communication. Avoid exposing `ipcRenderer` directly.
*   **Outcome:** A basic, secure, and typed communication channel between frontend and backend.

---

**Step 0.4: Integrate UI Framework (Ant Design v5)**

*   **Goal:** Set up the chosen UI component library for building the user interface.
*   **Tasks:**
    1.  Install Ant Design: `npm install antd @ant-design/icons`.
    2.  Import Ant Design's global CSS in the main renderer entry point (`src/renderer/main.tsx`):
        ```typescript
        // src/renderer/main.tsx
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import App from './App';
        import 'antd/dist/reset.css'; // Import Ant Design reset styles
        import './index.css'; // Your custom styles

        ReactDOM.createRoot(document.getElementById('root')!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        ```
    3.  Create a basic application layout component (`src/renderer/components/Layout.tsx`) using Ant Design components (`Layout`, `Menu`, `Content`, etc.).
    4.  Integrate the layout into `App.tsx`.
*   **Tools:** Ant Design, React.
*   **Outcome:** Ant Design is integrated, and a basic application shell/layout exists using its components.

---

**Step 0.5: Configure Development Workflow & Code Quality**

*   **Goal:** Streamline development, ensure code consistency and quality.
*   **Tasks:**
    1.  Configure `package.json` scripts:
        *   `dev`: Concurrently run Vite dev server and Electron (`electron-forge start`).
        *   `build`: Run Vite build then `electron-forge make`.
        *   `package`: Run `electron-forge package`.
        *   `lint`: Run ESLint.
        *   `format`: Run Prettier.
    2.  Set up ESLint: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks`. Configure `.eslintrc.js` (or `.cjs`) with recommended rules for TS, React, and hooks.
    3.  Set up Prettier: `npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier`. Configure `.prettierrc.js` and integrate with ESLint.
    4.  Configure VS Code (or other editor) extensions for ESLint and Prettier for auto-fixing and formatting on save.
*   **Tools:** npm/yarn scripts, ESLint, Prettier, Electron Forge CLI.
*   **Outcome:** A robust development environment with automated linting, formatting, and clear build/run scripts.

---

**Step 0.6: Basic Settings Persistence**

*   **Goal:** Implement a way to store and retrieve simple application settings.
*   **Tasks:**
    1.  Install `electron-store`: `npm install electron-store`.
    2.  Create a settings manager module in the main process (`src/main/services/settingsManager.ts`):
        ```typescript
        // src/main/services/settingsManager.ts
        import Store from 'electron-store';
        // Define a schema for type safety if desired
        const schema = { /* ... */ };
        const store = new Store({ schema });

        export const getSetting = <T>(key: string): T | undefined => store.get(key) as T | undefined;
        export const setSetting = <T>(key: string, value: T): void => store.set(key, value);
        ```
    3.  Expose settings access via IPC (add methods to `IElectronAPI`, `preload.ts`, and handlers in `main/index.ts` using the `settingsManager`). Keep it minimal initially (e.g., `getSettings`, `updateSetting`).
*   **Tools:** `electron-store`, Electron IPC.
*   **Considerations:** For sensitive data like API keys, plan to use `keytar` later (Phase 5 or 6), storing only non-sensitive preferences in `electron-store`.
*   **Outcome:** Basic application settings can be persisted across sessions.

---
**End of Phase 0:** The project has a solid foundation: an Electron app running React+TS via Vite, styled with Ant Design, with typed IPC, basic settings persistence, and a proper development/build workflow.

---

## Phase 1: Backend Integration (Detailed Plan)

**Goal:** Integrate core external tools and online APIs required for the video processing pipeline by creating robust wrapper modules in the Node.js (main process) backend.

**Best Practices Focus (Jan 2025):**
*   **Modularity:** Encapsulate each external tool/API in its own service/module.
*   **Asynchronicity:** Use `async/await` extensively, manage Promises correctly.
*   **Error Handling:** Implement consistent and informative error handling for external processes and API calls.
*   **Process Management:** Use `child_process.spawn` for CLI tools to handle streams (stdout/stderr) for progress and output, avoiding large buffers (`exec`).
*   **Dependency Management:** Use reliable wrappers or manage bundled binaries carefully.
*   **Interfaces:** Define clear TypeScript interfaces for service inputs/outputs.

---

**Step 1.1: Strategy for External CLI Dependencies**

*   **Goal:** Define how non-Node dependencies (ffmpeg, yt-dlp, Python tools) will be managed and packaged.
*   **Tasks:**
    1.  **Research & Select Packages:**
        *   `ffmpeg`: Use `ffmpeg-static` to get platform-specific binaries.
        *   `yt-dlp`: Use `yt-dlp-wrap` or download a specific binary release during build/postinstall. `yt-dlp-wrap` is often easier.
        *   `Demucs`, `Whisper (local)`, `Fish Speech`: These are Python-based.
            *   *Option A (Simpler Dev, Harder Distribution):* Require users to have Python + specific packages installed. Provide setup instructions.
            *   *Option B (Self-Contained, Complex Setup):* Package a minimal Python environment (e.g., using PyInstaller on the Python script wrappers, or embedding Python via tools like `python-bridge`). *Decision:* Start with Option A for faster development, clearly documenting the Python dependency. Revisit packaging (Option B) in Phase 5 (Offline Mode & Dependencies).
        *   `Soundtouch`: Find a Node.js binding or compile/bundle the `soundstretch` CLI utility. If CLI, use `soundstretch-bin` or similar if available, otherwise bundle manually.
    2.  **Document:** Clearly document the chosen approach and any prerequisites for developers and (initially) users.
    3.  **Integrate Binary Paths:** Ensure wrappers can locate the necessary executables (e.g., using paths provided by `-static` or `-wrap` packages, or configured paths).
*   **Tools:** `npm`, potentially `ffmpeg-static`, `yt-dlp-wrap`.
*   **Outcome:** A clear plan and initial setup for accessing required CLI tools from the Node.js backend.

---

**Step 1.2: yt-dlp Wrapper Service**

*   **Goal:** Create a module to interact with `yt-dlp` for downloading video information and media.
*   **Tasks:**
    1.  Create `src/main/services/ytDlpService.ts`.
    2.  Use `yt-dlp-wrap` (or `child_process.spawn` if calling binary directly).
    3.  Implement functions:
        *   `getVideoInfo(url: string): Promise<YtDlpVideoInfo>` (Define `YtDlpVideoInfo` interface).
        *   `downloadMedia(url: string, formatCode: string, outputPath: string, progressCallback?: (progress: number) => void): Promise<string>` (Returns final file path).
    4.  Handle `yt-dlp` output parsing for progress (if using `spawn`) and errors. Wrap errors in custom error classes.
    5.  Add basic tests (if implementing testing strategy early).
*   **Tools:** `yt-dlp-wrap` or `child_process`, TypeScript.
*   **Outcome:** A service capable of fetching video metadata and downloading media from URLs, with error handling.

---

**Step 1.3: FFmpeg Wrapper Service**

*   **Goal:** Create a module for essential audio/video manipulation using FFmpeg.
*   **Tasks:**
    1.  Create `src/main/services/ffmpegService.ts`.
    2.  Use `ffmpeg-static` to locate the binary.
    3.  Use `child_process.spawn` to execute FFmpeg commands (more control than `fluent-ffmpeg`, especially for progress).
    4.  Implement functions:
        *   `extractAudio(videoPath: string, outputPath: string): Promise<string>`
        *   `mergeAudioVideo(videoPath: string, audioPath: string, outputPath: string): Promise<string>`
        *   `getVideoDuration(filePath: string): Promise<number>` (Using `ffprobe`, often bundled or available via `ffprobe-static`).
        *   (Optional) Add progress reporting by parsing FFmpeg's `stderr` output.
    5.  Handle FFmpeg exit codes and errors.
*   **Tools:** `ffmpeg-static`, `child_process`, TypeScript.
*   **Outcome:** A service for core media operations like audio extraction and merging.

---

**Step 1.4: Online AI Service Client (OpenAI)**

*   **Goal:** Create a reusable client for interacting with OpenAI APIs (Whisper, GPT, TTS).
*   **Tasks:**
    1.  Create `src/main/services/openAiClient.ts`.
    2.  Use Node's built-in `fetch` (available in Node 22+) or install `axios`.
    3.  Implement base client logic: handling API keys (initially read from settings/env, later secure storage), base URL, headers, error handling (rate limits, API errors).
    4.  Implement STT function:
        *   `transcribeAudio(audioPath: string, language?: string): Promise<TranscriptionResult>` (Define `TranscriptionResult` interface possibly with VTT/SRT format). Use Whisper API endpoint. Handle file uploads (`FormData`).
    5.  Implement Translation function:
        *   `translateText(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult>` (Define `TranslationResult`). Use GPT-4o-mini/similar endpoint. Handle text chunking if necessary.
    6.  Implement TTS function:
        *   `synthesizeSpeech(text: string, voice: string, outputPath: string): Promise<string>` (Returns audio file path). Use TTS API endpoint. Handle streaming response to file.
    7.  Define clear interfaces for inputs and outputs.
*   **Tools:** Node `fetch`/`axios`, TypeScript.
*   **Considerations:** API key management security is paramount. Error handling needs to be robust.
*   **Outcome:** A client capable of performing online STT, translation, and TTS using OpenAI.

---

**Step 1.5: Define Interfaces for Processing Services**

*   **Goal:** Define abstract interfaces for each core processing step to facilitate future implementation swapping (online vs. offline - Strategy Pattern).
*   **Tasks:**
    1.  Create interface definitions in `src/shared/processing-interfaces.ts` (or similar).
        ```typescript
        // src/shared/processing-interfaces.ts
        export interface TranscriptionResult { text: string; segments?: { start: number; end: number; text: string }[]; /* ...or VTT/SRT string */ }
        export interface TranslationResult { translatedText: string; }
        export interface SynthesisResult { audioPath: string; }

        export interface ISttService {
          transcribe(audioPath: string, language?: string): Promise<TranscriptionResult>;
        }
        export interface ITranslationService {
          translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult>;
        }
        export interface ITtsService {
          synthesize(text: string, voice: string, outputPath: string): Promise<SynthesisResult>;
        }
        // Define interfaces for Demucs, Soundtouch too
        export interface ISeparationService {
          separateVocals(audioPath: string, outputDir: string): Promise<{ vocalPath: string; instrumentalPath: string }>;
        }
        export interface ITimingService {
          adjustTiming(audioPath: string, factor: number, outputPath: string): Promise<string>;
        }
        ```
    2.  Refactor the Online AI Client (Step 1.4) and other planned wrappers (Demucs, Soundtouch placeholders) to implement these interfaces.
*   **Tools:** TypeScript.
*   **Outcome:** Standardized interfaces for core processing tasks, enabling flexible implementation choices later.

---

**Step 1.6: (Placeholder) Wrappers for Demucs & Soundtouch**

*   **Goal:** Create placeholder modules and implement the defined interfaces for Demucs and Soundtouch, even if the underlying execution logic (Python/CLI calls) is basic or deferred.
*   **Tasks:**
    1.  Create `src/main/services/demucsService.ts` implementing `ISeparationService`. Include basic `spawn` logic for a hypothetical Python script or CLI command. Add error handling and path management.
    2.  Create `src/main/services/soundtouchService.ts` implementing `ITimingService`. Include basic `spawn` logic for `soundstretch` CLI or a binding. Add error handling.
    3.  Document the dependency requirements (Python version, packages, `soundstretch` binary).
*   **Tools:** `child_process`, TypeScript.
*   **Outcome:** Interface-compliant service modules exist for Demucs and Soundtouch, ready for full implementation or refinement later. The structure for interacting with these tools is in place.

---

**Step 1.7: Expose Backend Services via IPC**

*   **Goal:** Make the core functionalities of the newly created backend services available to the frontend through the established typed IPC mechanism.
*   **Tasks:**
    1.  Define new IPC channels and methods in `src/shared/ipc-types.ts` and the `IElectronAPI` interface. Examples: `downloadVideo`, `extractAudio`, `transcribeOnline`, `translateOnline`, `synthesizeOnline`.
    2.  Update the preload script (`src/preload/index.ts`) to expose these new methods, calling the appropriate `ipcRenderer.invoke` with the correct channel.
    3.  Update the main process (`src/main/index.ts`) to handle these new channels using `ipcMain.handle`. The handlers will call the respective service methods (e.g., `ytDlpService.downloadMedia(...)`, `openAiClient.transcribeAudio(...)`).
    4.  Ensure parameters and return values align with the defined types and interfaces. Handle potential errors from the services and propagate them appropriately over IPC (perhaps as structured error objects).
*   **Tools:** Electron IPC, TypeScript.
*   **Outcome:** Frontend can now trigger core backend processing tasks (downloading, online AI operations) via the secure IPC bridge.

---
**End of Phase 1:** The backend is significantly built out. Wrapper services for key external tools (yt-dlp, ffmpeg) and online AI services (OpenAI STT, Translate, TTS) are implemented and accessible from the frontend via IPC. Interfaces for all processing steps are defined, preparing for future offline implementations and the core pipeline orchestration. Placeholder wrappers for more complex dependencies (Demucs, Soundtouch) are in place.