import { useState, useEffect } from 'react';
import { Button, Typography, Divider, Alert, Spin, Space, Row, Col, Card } from 'antd';
import { CheckCircleFilled, SettingOutlined, KeyOutlined, FolderOpenOutlined } from '@ant-design/icons';
import AppLayout from './components/Layout';
import { Settings } from './components/Settings';
import SettingsModal from './components/SettingsModal';
import InputForm, { FormData } from './components/InputForm';
import './App.css';
import './styles/Settings.css';

const { Title, Text } = Typography;

function App() {
  const [formData, setFormData] = useState<FormData>({
    videoUrl: '',
    downloadFolder: '',
    originalLanguage: undefined,
    targetLanguage: 'ru',
  });
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [progress, setProgress] = useState({
    downloadingVideo: false,
    downloadingAudio: false,
    separatingSpeech: false,
    convertingToSubtitles: false,
  });
  const [completed, setCompleted] = useState(false);

  // Load theme from settings when component mounts
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await window.electronAPI.getSetting<'light' | 'dark'>('theme');
        if (savedTheme) {
          setTheme(savedTheme);
          // Apply theme to body element
          document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
        }
      } catch (error) {
        console.error('Failed to load theme setting:', error);
      }
    };
    
    loadTheme();
  }, []);

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleTranslate = async () => {
    if (!formData.videoUrl || !formData.downloadFolder || !formData.targetLanguage) return;
    
    try {
      // Set processing flag and update status message
      setProcessing(true);
      setStatusMessage('Начинаем обработку...');
      setStatusType('info');
      
      setProgress({ 
        downloadingVideo: false,
        downloadingAudio: false,
        separatingSpeech: false,
        convertingToSubtitles: false 
      });
      
      // Call the IPC method to start processing
      const result = await window.electronAPI.startProcessing({
        url: formData.videoUrl,
        downloadFolder: formData.downloadFolder,
        originalLanguage: formData.originalLanguage,
        targetLanguage: formData.targetLanguage
      });
      
      if (result.success) {
        // Update status message for successful start
        setStatusMessage('Обработка начата...');
        setStatusType('success');
        
        // Start showing progress indicators (this would eventually be replaced with real-time updates)
        setProgress(prev => ({ ...prev, downloadingVideo: true }));
        
        // For demo purposes, continue with the simulated progress
        setTimeout(() => {
          setProgress(prev => ({ ...prev, downloadingAudio: true }));
          setTimeout(() => {
            setProgress(prev => ({ ...prev, separatingSpeech: true }));
            setTimeout(() => {
              setProgress(prev => ({
                downloadingVideo: true,
                downloadingAudio: true,
                separatingSpeech: true,
                convertingToSubtitles: true
              }));
              setCompleted(true);
              setProcessing(false);
              setStatusMessage('Обработка успешно завершена!');
            }, 1000);
          }, 1000);
        }, 1000);
      } else {
        // If there's an error from the backend, stop processing and show error
        setProcessing(false);
        setStatusMessage(result.message || 'При запуске обработки произошла ошибка.');
        setStatusType('error');
        console.error('Processing failed:', result.message);
      }
    } catch (error) {
      console.error('Error during processing:', error);
      setProcessing(false);
      setStatusMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setStatusType('error');
    }
  };

  return (
    <AppLayout>
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header with title and settings buttons */}
          <Row className="app-header" justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>VideoNova 2</Title>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<KeyOutlined />} 
                  onClick={() => setShowSettingsModal(true)}
                  type="text"
                  size="large"
                  title="API Settings"
                />
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => setShowSettings(true)}
                  type="text"
                  size="large"
                  title="App Settings"
                />
              </Space>
            </Col>
          </Row>
          
          {/* Main content area with input form and status */}
          <Card className="content-card">
            <Spin spinning={processing} tip="Обработка видео..." size="large">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <InputForm 
                  onFormChange={handleFormChange}
                  initialValues={formData}
                />
                
                {statusMessage && (
                  <Alert
                    message={statusMessage}
                    type={statusType}
                    showIcon
                    closable
                    onClose={() => setStatusMessage(null)}
                  />
                )}
                
                <Row justify="center">
                  <Button 
                    type="primary" 
                    onClick={handleTranslate}
                    disabled={processing || !formData.videoUrl || !formData.downloadFolder || !formData.targetLanguage}
                    loading={processing}
                    size="large"
                    style={{ minWidth: '150px' }}
                  >
                    Translate
                  </Button>
                </Row>
              </Space>
            </Spin>
          </Card>
          
          {/* Progress section */}
          <Card className="progress-card">
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Text strong>
                  {formData.targetLanguage && `Translate to: ${formData.targetLanguage}`}
                </Text>
              </Col>
              
              <Col xs={24} md={16}>
                <div className="progress-list">
                  <div className="progress-item">
                    {progress.downloadingVideo ? 
                      <CheckCircleFilled className="progress-icon progress-complete" /> :
                      <div className="progress-icon-empty" />
                    }
                    <Text>Downloading video</Text>
                  </div>
                  <div className="progress-item">
                    {progress.downloadingAudio ? 
                      <CheckCircleFilled className="progress-icon progress-complete" /> :
                      <div className="progress-icon-empty" />
                    }
                    <Text>Downloading audio</Text>
                  </div>
                  <div className="progress-item">
                    {progress.separatingSpeech ? 
                      <CheckCircleFilled className="progress-icon progress-complete" /> :
                      <div className="progress-icon-empty" />
                    }
                    <Text>Separating speech and noise</Text>
                  </div>
                  <div className="progress-item">
                    {progress.convertingToSubtitles ? 
                      <CheckCircleFilled className="progress-icon progress-complete" /> :
                      <div className="progress-icon-empty" />
                    }
                    <Text>Converting audio to subtitles</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
          
          {/* Completion section */}
          {completed && (
            <Card className="completion-card">
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Text className="result-message" strong>
                  File downloaded and translated successfully.
                </Text>
                <Button 
                  type="primary" 
                  icon={<FolderOpenOutlined />}
                  className="open-button"
                >
                  Open Video File
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      )}
      
      <SettingsModal 
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </AppLayout>
  );
}

export default App;
