import { useState, useEffect } from 'react';
import { Button, Typography, Divider, Checkbox, Tooltip, Alert, Spin } from 'antd';
import { CheckCircleFilled, SettingOutlined, KeyOutlined } from '@ant-design/icons';
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
        <>
          <div className="app-header">
            <Title level={2}>Language Translate</Title>
            <div>
              <Tooltip title="API Settings">
                <Button 
                  icon={<KeyOutlined />} 
                  onClick={() => setShowSettingsModal(true)}
                  type="text"
                  style={{ marginRight: '8px' }}
                />
              </Tooltip>
              <Tooltip title="App Settings">
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => setShowSettings(true)}
                  type="text"
                />
              </Tooltip>
            </div>
          </div>
          
          <div className="main-content">
            <Spin spinning={processing} tip="Обработка видео...">
              <InputForm 
                onFormChange={handleFormChange}
                initialValues={formData}
              />
            </Spin>
            
            {statusMessage && (
              <Alert
                message={statusMessage}
                type={statusType}
                showIcon
                style={{ marginTop: '16px', marginBottom: '16px' }}
                closable
                onClose={() => setStatusMessage(null)}
              />
            )}
            
            <div className="action-buttons">
              <Button 
                type="primary" 
                onClick={handleTranslate}
                disabled={processing || !formData.videoUrl || !formData.downloadFolder || !formData.targetLanguage}
                loading={processing}
              >
                Translate
              </Button>
            </div>
          </div>
          
          <Divider className="app-divider" />
          
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, marginRight: '30px' }}>
              <Text strong>
                {formData.targetLanguage && `Translate to: ${formData.targetLanguage}`}
              </Text>
            </div>
            
            <div style={{ flex: 1 }}>
              <div className="progress-list">
                <div className="progress-item">
                  {progress.downloadingVideo && <CheckCircleFilled className="progress-icon" />}
                  <Text>Downloading video</Text>
                </div>
                <div className="progress-item">
                  {progress.downloadingAudio && <CheckCircleFilled className="progress-icon" />}
                  <Text>Downloading audio</Text>
                </div>
                <div className="progress-item">
                  {progress.separatingSpeech && <CheckCircleFilled className="progress-icon" />}
                  <Text>Separating speech and noise</Text>
                </div>
                <div className="progress-item">
                  {progress.convertingToSubtitles && <CheckCircleFilled className="progress-icon" />}
                  <Text>Converting audio to subtitles</Text>
                </div>
              </div>
            </div>
          </div>
          
          {completed && (
            <>
              <Text className="result-message">File downloaded and translated successfully.</Text>
              <Button className="open-button">Open Video File</Button>
            </>
          )}
        </>
      )}
      
      <SettingsModal 
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </AppLayout>
  );
}

export default App;
