import { useState, useEffect } from 'react';

interface SettingsProps {
  onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get theme setting
        const savedTheme = await window.electronAPI.getSetting<'light' | 'dark'>('theme');
        if (savedTheme) setTheme(savedTheme);
        
        // Get window size setting
        const savedSize = await window.electronAPI.getSetting<{ width: number; height: number }>('windowSize');
        if (savedSize) setWindowSize(savedSize);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save theme setting when changed
  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      await window.electronAPI.setSetting('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  };

  // Save window size settings
  const handleSizeChange = async (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const newSize = { ...windowSize, [dimension]: numValue };
    setWindowSize(newSize);
    
    try {
      await window.electronAPI.setSetting('windowSize', newSize);
    } catch (error) {
      console.error('Failed to save window size settings:', error);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      
      <div className="setting-group">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label>
            Theme:
            <select 
              value={theme} 
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>
      
      <div className="setting-group">
        <h3>Window</h3>
        <div className="setting-item">
          <label>
            Width:
            <input 
              type="number" 
              min={800} 
              value={windowSize.width} 
              onChange={(e) => handleSizeChange('width', e.target.value)}
            />
          </label>
        </div>
        <div className="setting-item">
          <label>
            Height:
            <input 
              type="number" 
              min={600} 
              value={windowSize.height} 
              onChange={(e) => handleSizeChange('height', e.target.value)}
            />
          </label>
        </div>
      </div>
      
      {onClose && (
        <button onClick={onClose}>Close</button>
      )}
    </div>
  );
} 