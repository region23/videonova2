import React from 'react';
import { Form, Input, Select, Button } from 'antd';
import { LinkOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { LANGUAGES } from '../../shared/constants';

export interface FormData {
  videoUrl: string;
  downloadFolder: string;
  originalLanguage?: string;
  targetLanguage: string;
}

interface InputFormProps {
  onFormChange: (data: FormData) => void;
  initialValues?: Partial<FormData>;
}

const InputForm: React.FC<InputFormProps> = ({ onFormChange, initialValues }) => {
  const [form] = Form.useForm();
  
  const handleFormChange = () => {
    const formData = form.getFieldsValue();
    onFormChange(formData);
  };

  const handleFolderSelection = async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        form.setFieldsValue({ downloadFolder: folderPath });
        handleFormChange();
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={handleFormChange}
    >
      <Form.Item
        name="videoUrl"
        label="Video URL"
        rules={[{ required: true, message: 'Please enter a video URL' }]}
      >
        <Input 
          prefix={<LinkOutlined />} 
          placeholder="https://www.youtube.com/watch?v=..." 
        />
      </Form.Item>
      
      <Form.Item
        name="downloadFolder"
        label="Download Folder"
        rules={[{ required: true, message: 'Please select a download folder' }]}
      >
        <Input 
          readOnly
          placeholder="Select download folder..."
          addonAfter={
            <Button 
              icon={<FolderOpenOutlined />} 
              onClick={handleFolderSelection}
              type="text"
            />
          }
        />
      </Form.Item>

      <Form.Item
        name="originalLanguage"
        label="Original Language (if not auto-detected)"
      >
        <Select
          placeholder="Select original language"
          options={LANGUAGES}
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="targetLanguage"
        label="Target Language"
        rules={[{ required: true, message: 'Please select a target language' }]}
      >
        <Select
          placeholder="Select target language"
          options={LANGUAGES}
        />
      </Form.Item>
    </Form>
  );
};

export default InputForm; 