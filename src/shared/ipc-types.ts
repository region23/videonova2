// IPC API type definitions for secure main/renderer process communication

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  // Settings methods
  getSetting: <T>(key: string) => Promise<T | undefined>;
  setSetting: <T>(key: string, value: T) => Promise<void>;
  getSettings: () => Promise<Record<string, any>>;
  // Add more methods as needed
}

export const Channels = {
  GET_APP_VERSION: 'ipc:get-app-version',
  // Settings channels
  GET_SETTING: 'ipc:get-setting',
  SET_SETTING: 'ipc:set-setting',
  GET_SETTINGS: 'ipc:get-settings',
} as const; // Use const assertion for type safety

// Type for channel names to ensure type safety when using channels
export type ChannelNames = keyof typeof Channels; 