import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Templates({ company }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'itt',
    content: '',
    variables: []
  });

  useEffect(() => {
    loadTemplates();
  }, [company]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    
    setTemplates(data || []);
  };

  const handleCreateTemplate = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('templates')
      .insert({
        company_id: company.id,
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        content: newTemplate.content,
        variables: ['company_name', 'project_name'] // Default variables
      });

    if (error) {
      alert('Error creating template: ' + error.message);
    } else {
      setShowForm(false);
      setNewTemplate({ name: '', description: '', type: 'itt', content: '' });
      loadTemplates();
    }
    
    setLoading(false);
  };

  return (
    <div className="templates-container">
      <div className="templates-header">
        <h2>📋 Templates</h2>
        <button 
          className="create-btn"
          onClick={() => setShowForm(true)}
        >
          + New Template
        </button>
      </div>

      {showForm && (
        <div className="template-form">
          <h3>Create New Template</h3>
          
          <div className="form-group">
            <label>Template Name</label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              placeholder="e.g., Standard ITT 2024"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
              placeholder="Brief description of this template"
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={newTemplate.type}
              onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
            >
              <option value="itt">ITT (Invitation to Tender)</option>
              <option value="evaluation">Evaluation Matrix</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              className="content-editor"
              rows="10"
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
              placeholder={`Enter template content...\nUse {{company_name}} for dynamic variables`}
            />
            <small>Use &#123;&#123;variable&#125;&#125; for dynamic fields</small>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button 
              className="save-btn"
              onClick={handleCreateTemplate}
              disabled={loading || !newTemplate.name || !newTemplate.content}
            >
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      )}

      <div className="templates-list">
        {templates.length === 0 ? (
          <div className="empty-state">
            <p>No templates yet. Create your first template!</p>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h4>{template.name}</h4>
                <span className="template-type">{template.type}</span>
              </div>
              <p className="template-description">{template.description}</p>
              <div className="template-meta">
                <span>Version {template.version}</span>
                <span>Variables: {template.variables?.length || 0}</span>
              </div>
              <div className="template-actions">
                <button className="edit-btn">Edit</button>
                <button className="delete-btn">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}