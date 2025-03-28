// IPC API type definitions for secure main/renderer process communication

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  // Add more methods as needed
}

export const Channels = {
  GET_APP_VERSION: 'ipc:get-app-version',
} as const; // Use const assertion for type safety

// Type for channel names to ensure type safety when using channels
export type ChannelNames = keyof typeof Channels; 