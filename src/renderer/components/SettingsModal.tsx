import { useState, useEffect } from 'react';
import { Modal, Input, Button, Form, message } from 'antd';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  // Load API key from settings when modal is opened
  useEffect(() => {
    if (visible) {
      loadApiKey();
    }
  }, [visible]);

  const loadApiKey = async () => {
    try {
      const savedApiKey = await window.electronAPI.getSetting<string>('openai.apiKey');
      if (savedApiKey) {
        setApiKey(savedApiKey);
        form.setFieldsValue({ apiKey: savedApiKey });
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
      message.error('Failed to load API key');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Call the IPC method to save the API key
      await window.electronAPI.setSetting('openai.apiKey', values.apiKey);
      
      // Also update openAIClient via the dedicated method
      await window.electronAPI.setOpenAIApiKey(values.apiKey);
      
      message.success('API key saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save API key:', error);
      message.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          onClick={handleSave}
          loading={loading}
        >
          Save
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ apiKey }}
      >
        <Form.Item
          name="apiKey"
          label="OpenAI API Key"
          rules={[
            { 
              required: true, 
              message: 'Please enter your OpenAI API key' 
            }
          ]}
        >
          <Input.Password 
            placeholder="Enter your OpenAI API key"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal; 