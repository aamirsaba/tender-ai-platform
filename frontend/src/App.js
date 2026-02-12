import React, { useState } from 'react';
import './App.css';

function App() {
  const [tenders, setTenders] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ HARDCODED - THIS WILL WORK IMMEDIATELY
  const API_URL = 'https://tender-ai-backend-yc7k.onrender.com';

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append('document', file);

    try {
      console.log('Uploading to:', API_URL);
      
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        setCurrentAnalysis(data.analysis);
        
        const newTender = {
          id: Date.now(),
          name: file.name,
          date: new Date().toLocaleDateString(),
          deadline: data.analysis.deadline,
          status: 'Analyzed'
        };
        
        setTenders([newTender, ...tenders]);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error analyzing document. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 TenderAI</h1>
        <p>AI-Powered Tender Management Platform</p>
      </header>

      <div className="container">
        {/* Left Panel - Upload */}
        <div className="left-panel">
          <div className="upload-card">
            <h3>📤 Upload Tender Document</h3>
            <div className="upload-area">
              <input
                type="file"
                id="fileUpload"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button 
                className="upload-button"
                onClick={() => document.getElementById('fileUpload').click()}
                disabled={loading}
              >
                {loading ? '⏳ Analyzing...' : '📄 Choose File'}
              </button>
              <p className="small">Supports PDF, DOC, DOCX (Max 10MB)</p>
            </div>
          </div>

          {currentAnalysis && (
            <div className="analysis-card">
              <h3>📋 Analysis Results</h3>
              
              <div className="deadline-box">
                <span className="label">Submission Deadline:</span>
                <span className="deadline">{currentAnalysis.deadline}</span>
              </div>

              <div className="requirements">
                <h4>⚠️ Critical Requirements:</h4>
                <ul>
                  {currentAnalysis.requirements?.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="evaluation">
                <h4>📊 Evaluation Criteria:</h4>
                <div className="criteria-grid">
                  {Object.entries(currentAnalysis.evaluation_criteria || {}).map(([key, value]) => (
                    <div key={key} className="criteria-item">
                      <span className="criteria-label">{key}:</span>
                      <span className="criteria-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Dashboard */}
        <div className="right-panel">
          <h3>📊 Tender Dashboard</h3>
          
          {tenders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h4>No tenders yet</h4>
              <p>Upload a tender document to get started</p>
            </div>
          ) : (
            <div className="tender-list">
              {tenders.map(tender => (
                <div key={tender.id} className="tender-item">
                  <div className="tender-info">
                    <strong>{tender.name}</strong>
                    <div className="tender-meta">
                      <span>📅 {tender.date}</span>
                      <span>⏰ Due: {tender.deadline}</span>
                    </div>
                  </div>
                  <span className="status completed">✓ Analyzed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;