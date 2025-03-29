import { useState, useEffect } from 'react';
import { Card, Select, InputNumber, Button, Typography, Space, Divider, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

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
      // Apply theme immediately
      document.body.className = newTheme === 'dark' ? 'dark-theme' : '';
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  };

  // Save window size settings
  const handleSizeChange = async (dimension: 'width' | 'height', value: number | null) => {
    if (value === null) return;
    
    const newSize = { ...windowSize, [dimension]: value };
    setWindowSize(newSize);
    
    try {
      await window.electronAPI.setSetting('windowSize', newSize);
    } catch (error) {
      console.error('Failed to save window size settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            {onClose && (
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={onClose}
                type="text"
                size="large"
              />
            )}
            <Title level={2} style={{ margin: 0 }}>Settings</Title>
          </Space>
        </Col>
      </Row>
      
      <Card title="Appearance" className="content-card">
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Text strong>Theme</Text>
          </Col>
          <Col span={16}>
            <Select 
              value={theme} 
              onChange={handleThemeChange}
              style={{ width: '100%' }}
            >
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
            </Select>
          </Col>
        </Row>
      </Card>
      
      <Card title="Window" className="content-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col span={8}>
              <Text strong>Width</Text>
            </Col>
            <Col span={16}>
              <InputNumber 
                min={800} 
                value={windowSize.width} 
                onChange={(value) => handleSizeChange('width', value)}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Row gutter={[16, 16]} align="middle">
            <Col span={8}>
              <Text strong>Height</Text>
            </Col>
            <Col span={16}>
              <InputNumber 
                min={600} 
                value={windowSize.height} 
                onChange={(value) => handleSizeChange('height', value)}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Space>
      </Card>
      
      {onClose && (
        <Row justify="center">
          <Button 
            onClick={onClose}
            type="primary"
            size="large"
          >
            Save & Close
          </Button>
        </Row>
      )}
    </Space>
  );
} 