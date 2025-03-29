import { useState, useEffect } from 'react';
import { Button, Typography, Divider, Checkbox } from 'antd';
import { CheckCircleFilled, SettingOutlined } from '@ant-design/icons';
import AppLayout from './components/Layout';
import { Settings } from './components/Settings';
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
  const [showSettings, setShowSettings] = useState(false);
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

  const handleTranslate = () => {
    if (!formData.videoUrl || !formData.downloadFolder || !formData.targetLanguage) return;
    setProcessing(true);
    
    // This would be replaced with actual API calls and processing logic
    // Simulating the process for demo purposes
    setTimeout(() => {
      setProgress({ ...progress, downloadingVideo: true });
      setTimeout(() => {
        setProgress({ ...progress, downloadingVideo: true, downloadingAudio: true });
        setTimeout(() => {
          setProgress({ ...progress, downloadingVideo: true, downloadingAudio: true, separatingSpeech: true });
          setTimeout(() => {
            setProgress({
              downloadingVideo: true,
              downloadingAudio: true,
              separatingSpeech: true,
              convertingToSubtitles: true
            });
            setCompleted(true);
            setProcessing(false);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return (
    <AppLayout>
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <>
          <div className="app-header">
            <Title level={2}>Language Translate</Title>
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setShowSettings(true)}
              type="text"
            />
          </div>
          
          <div className="main-content">
            <InputForm 
              onFormChange={handleFormChange}
              initialValues={formData}
            />
            
            <div className="action-buttons">
              <Button 
                type="primary" 
                onClick={handleTranslate}
                disabled={processing || !formData.videoUrl || !formData.downloadFolder || !formData.targetLanguage}
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
    </AppLayout>
  );
}

export default App;
