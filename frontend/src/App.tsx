import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [personality, setPersonality] = useState<'normal' | 'salesperson' | 'shakespeare'>('normal');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handlePersonalitySelect = (selectedPersonality: 'normal' | 'salesperson' | 'shakespeare') => {
    setPersonality(selectedPersonality);
    
    // Send the personality selection to the backend
    axios.post(`${API_URL}/set-personality`, { type: selectedPersonality })
      .then(response => {
        console.log('Personality set response:', response.data);
        // Add a message to the conversation to indicate the personality change
        setConversation([{ 
          role: 'system', 
          content: `AI personality set to ${selectedPersonality === 'normal' ? 'Normal' : 
                    selectedPersonality === 'salesperson' ? 'Crazy Salesperson' : 'Shakespeare'}.`
        }]);
      })
      .catch(error => {
        console.error('Error setting personality:', error);
        setError('Failed to set AI personality. Please try again.');
      });
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
    }
  };

  // const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setFile(e.target.files[0]);
  //     const formData = new FormData();
  //     formData.append('file', e.target.files[0]);
      
  //     setIsLoading(true);
  //     setError('');
      
  //     try {
  //       const response = await axios.post('http://localhost:8000/upload', formData);
  //       console.log('Upload response:', response.data);
  //       setConversation([{ role: 'system', content: 'PDF uploaded successfully. You can now ask questions.'}, { role: 'system2', content: response.data.answer}]);
  //     } catch (error) {
  //       console.error('Error uploading file:', error);
  //       setError('Failed to upload PDF. Please try again.');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  const handleFilesUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one PDF file.');
      return;
    }
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/upload`, formData);
      console.log('Upload response:', response.data);
      setUploadedFiles(response.data.files || []);
      setConversation([
        { 
          role: 'system', 
          content: `${files.length} PDF${files.length > 1 ? 's' : ''} uploaded successfully. AI will respond as ${
            personality === 'normal' ? 'a helpful assistant' : 
            personality === 'salesperson' ? 'an over-the-top salesperson' : 'Shakespeare'
          }.`
        }, 
        { role: 'assistant', content: response.data.answer }
      ]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload PDFs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    
    // Add user question to conversation immediately for better UX
    const updatedConversation = [...conversation, { role: 'user', content: question }];
    setConversation(updatedConversation);
    
    try {
      console.log('Sending question:', question);
      const response = await axios.post(`${API_URL}/ask`, { text: question });
      console.log('Answer response:', response.data);
      setConversation([...updatedConversation, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      console.error('Error asking question:', error);
      setError('Failed to get answer. Please try again.');
      // Keep the conversation as is with the user question
    } finally {
      setQuestion('');
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>PDF Question Answering</h1>
      
      <div className="personality-selector">
        <h2>Select AI Personality</h2>
        <div className="personality-buttons">
          <button 
            className={`personality-button ${personality === 'normal' ? 'active' : ''}`}
            onClick={() => handlePersonalitySelect('normal')}
            disabled={isLoading || uploadedFiles.length > 0}
          >
            Normal
          </button>
          <button 
            className={`personality-button ${personality === 'salesperson' ? 'active' : ''}`}
            onClick={() => handlePersonalitySelect('salesperson')}
            disabled={isLoading || uploadedFiles.length > 0}
          >
            Crazy Salesperson
          </button>
          <button 
            className={`personality-button ${personality === 'shakespeare' ? 'active' : ''}`}
            onClick={() => handlePersonalitySelect('shakespeare')}
            disabled={isLoading || uploadedFiles.length > 0}
          >
            Shakespeare
          </button>
        </div>
        <p className="personality-description">
          {personality === 'normal' ? 
            'The AI will respond in a helpful, straightforward manner.' : 
           personality === 'salesperson' ? 
            'The AI will respond like an enthusiastic, over-the-top salesperson!' : 
            'The AI will respond in the style of William Shakespeare, with poetic flair and old English.'}
        </p>
      </div>
      
      <div className="upload-section">
        <h2>Upload PDFs</h2>
        <form onSubmit={handleFilesUpload}>
          <input 
            type="file" 
            accept=".pdf" 
            multiple
            onChange={handleFileSelect} 
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || files.length === 0}
          >
            Upload PDFs
          </button>
        </form>
        {isLoading && <p>Processing...</p>}
        
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Uploaded Files:</h3>
            <ul>
              {uploadedFiles.map((filename, index) => (
                <li key={index}>{filename}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>
              {msg.role === 'user' ? 'You: ' : 
               msg.role === 'system' ? 'System: ' : 
               'AI: '}
            </strong>
            <span>{msg.content}</span>
          </div>
        ))}
        {error && <div className="error">{error}</div>}
      </div>
      
      <form onSubmit={handleQuestionSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the PDFs..."
          disabled={isLoading || uploadedFiles.length === 0}
        />
        <button 
          type="submit" 
          disabled={isLoading || !question.trim() || uploadedFiles.length === 0}
        >
          {isLoading ? 'Loading...' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default App;