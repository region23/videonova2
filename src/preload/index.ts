import { contextBridge } from 'electron';

// Expose a minimal API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // We'll expand this in Step 0.3
}); 