import React, { ReactNode } from 'react';
import { Card } from 'antd';
import '../styles/layout.css';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      <Card className="app-card">
        {children}
      </Card>
    </div>
  );
};

export default AppLayout; 