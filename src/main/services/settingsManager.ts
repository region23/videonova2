import Store from 'electron-store';

// Define schema for type checking
interface StoreSchema {
  theme?: 'light' | 'dark';
  recentProjects?: string[];
  windowSize?: { width: number; height: number };
  // Add more settings as needed
}

const schema = {
  theme: {
    type: 'string',
    enum: ['light', 'dark'],
    default: 'light'
  },
  recentProjects: {
    type: 'array',
    items: {
      type: 'string'
    },
    default: []
  },
  windowSize: {
    type: 'object',
    properties: {
      width: { type: 'number', minimum: 800 },
      height: { type: 'number', minimum: 600 }
    },
    default: { width: 1200, height: 800 }
  }
};

const store = new Store<StoreSchema>({ schema });

export const getSetting = <T>(key: string): T | undefined => store.get(key) as T | undefined;
export const setSetting = <T>(key: string, value: T): void => store.set(key, value);
export const getSettings = (): Partial<StoreSchema> => store.store; 