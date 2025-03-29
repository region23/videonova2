import React, { ReactNode, useState, useEffect } from 'react';
import { Card } from 'antd';
import '../styles/layout.css';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    // Load app version asynchronously when component mounts
    const loadAppVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to load app version:', error);
        setAppVersion('unknown');
      }
    };
    
    loadAppVersion();
  }, []);

  return (
    <div className="app-container">
      <div className="app-content">
        {children}
      </div>
      <div className="app-footer">
        <span className="app-version">VideoNova 2 {appVersion ? `| v${appVersion}` : ''}</span>
      </div>
    </div>
  );
};

export default AppLayout; 