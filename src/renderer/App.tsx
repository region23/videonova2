import { useState } from 'react';
import { Input, Button, Typography, Divider, Select, Checkbox } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import AppLayout from './components/Layout';
import './App.css';

const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [fromLanguage, setFromLanguage] = useState('English');
  const [toLanguage, setToLanguage] = useState('Russian');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({
    downloadingVideo: false,
    downloadingAudio: false,
    separatingSpeech: false,
    convertingToSubtitles: false,
  });
  const [completed, setCompleted] = useState(false);

  const handleTranslate = () => {
    if (!videoUrl) return;
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
      <Title level={2}>Language Translate</Title>
      
      <div className="app-input-group">
        <Input
          placeholder="https://www.example.com/video"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ width: 'calc(100% - 130px)', marginRight: '10px' }}
        />
        <Button 
          type="primary" 
          onClick={handleTranslate}
          disabled={processing || !videoUrl}
          style={{ width: '120px' }}
        >
          Translate
        </Button>
      </div>
      
      <Text strong>Translate language: {toLanguage}</Text>
      
      <Divider className="app-divider" />
      
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div className="app-input-group">
            <Text>Translate from:</Text>
            <Select 
              value={fromLanguage} 
              onChange={setFromLanguage}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="English">English</Option>
              <Option value="Spanish">Spanish</Option>
              <Option value="French">French</Option>
              <Option value="German">German</Option>
              <Option value="Chinese">Chinese</Option>
            </Select>
          </div>
          
          <div className="app-input-group">
            <Text>Translate to:</Text>
            <Select 
              value={toLanguage} 
              onChange={setToLanguage}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="Russian">Russian</Option>
              <Option value="English">English</Option>
              <Option value="Spanish">Spanish</Option>
              <Option value="French">French</Option>
              <Option value="German">German</Option>
              <Option value="Chinese">Chinese</Option>
            </Select>
          </div>
        </div>
        
        <div style={{ flex: 1, marginLeft: '30px' }}>
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
    </AppLayout>
  );
}

export default App;
