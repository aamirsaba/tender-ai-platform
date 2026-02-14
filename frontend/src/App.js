import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import CompanySetup from './components/CompanySetup';
import './App.css';

// Simple Auth Component
function SimpleAuth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email, password
        });
        if (error) throw error;
        
        // Create profile for new user
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          role: 'admin'
        });
        
        alert('Account created! Please sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email, password
        });
        if (error) throw error;
        onLogin(data.session);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🚀 TenderAI</h2>
        <h3>{isSignUp ? 'Create Account' : 'Sign In'}</h3>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        
        <button onClick={handleAuth} className="auth-button">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="toggle-btn"
        >
          {isSignUp ? 'Already have account? Sign In' : 'Need account? Sign Up'}
        </button>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user, company, onLogout, onSetupClick }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'itt',
    content: '',
    variables: []
  });

// Category and Requirement states
const [categories, setCategories] = useState([]);
const [requirements, setRequirements] = useState([]);
const [showCategoryForm, setShowCategoryForm] = useState(false);
const [showRequirementForm, setShowRequirementForm] = useState(false);
const [newCategory, setNewCategory] = useState({
  name: '',
  icon: '📋',
  color: '#667eea'
});
const [newRequirement, setNewRequirement] = useState({
  category_id: '',
  name: '',
  description: '',
  rule_type: 'text',
  is_mandatory: true,
  weight: 1
});


  // Tender states
  const [tenders, setTenders] = useState([]);
  const [showTenderForm, setShowTenderForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTender, setNewTender] = useState({
    title: '',
    template_id: '',
    deadline: '',
    file: null
  });

useEffect(() => {
  if (company) {
    loadTemplates();
    loadTenders();
    loadCategories();    // ADD THIS
    loadRequirements();  // ADD THIS
  }
}, [company]);


  const loadTemplates = async () => {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    
    setTemplates(data || []);
  };
  
// ADD THESE NEW FUNCTIONS HERE:
  const loadCategories = async () => {
    const { data } = await supabase
      .from('requirement_categories')
      .select('*')
      .eq('company_id', company.id)
      .order('sort_order');
    
    setCategories(data || []);
  };

  const loadRequirements = async () => {
    const { data } = await supabase
      .from('requirement_templates')
      .select('*, category:requirement_categories(name, icon)')
      .eq('company_id', company.id);
    
    setRequirements(data || []);
  };

// Add this after your other functions
const applyRequirementsToTender = async (tenderId) => {
  // Get all requirements for this company
  const { data: requirements } = await supabase
    .from('requirement_templates')
    .select('*')
    .eq('company_id', company.id);
  
  // Create tender_requirements entries
  const tenderRequirements = requirements.map(req => ({
    tender_id: tenderId,
    template_id: req.id,
    status: 'pending'
  }));
  
  await supabase.from('tender_requirements').insert(tenderRequirements);
  
  alert(`Applied ${requirements.length} requirements to tender`);
};



  const loadTenders = async () => {
    const { data } = await supabase
      .from('tenders')
      .select('*, templates(name)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    
    setTenders(data || []);
  };

  const handleCreateTemplate = async () => {
    const { error } = await supabase
      .from('templates')
      .insert({
        company_id: company.id,
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        content: newTemplate.content,
        variables: ['company_name', 'project_name']
      });

    if (error) {
      alert('Error creating template: ' + error.message);
    } else {
      setShowTemplateForm(false);
      setNewTemplate({ name: '', description: '', type: 'itt', content: '' });
      loadTemplates();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setNewTender({...newTender, file, title: file.name});
  };

  const handleCreateTender = async () => {
    setUploading(true);
    
    try {
      const { error } = await supabase
        .from('tenders')
        .insert({
          company_id: company.id,
          template_id: newTender.template_id || null,
          title: newTender.title,
          filename: newTender.file?.name,
          deadline: newTender.deadline,
          status: 'draft'
        });

      if (error) throw error;
      
      setShowTenderForm(false);
      setNewTender({ title: '', template_id: '', deadline: '', file: null });
      loadTenders();
      
    } catch (error) {
      alert('Error creating tender: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const viewRequirements = async (tenderId) => {
    try {
      const { data: requirements, error } = await supabase
        .from('tender_requirements')
        .select(`
          *,
          template:requirement_templates (
            name,
            description,
            rule_type,
            is_mandatory,
            weight,
            category:requirement_categories (name, icon)
          )
        `)
        .eq('tender_id', tenderId);
      
      if (error) throw error;
      
      if (requirements && requirements.length > 0) {
        const reqList = requirements.map(r => 
          `${r.template?.category?.icon || '📋'} ${r.template?.name}: ${r.status}`
        ).join('\n');
        
        alert(`Requirements for this tender:\n\n${reqList}`);
      } else {
        alert('No requirements defined for this tender yet. Add some rules first!');
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      alert('Error loading requirements');
    }
  };


  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>🚀 {company ? company.name : 'TenderAI'}</h1>
            <div className="company-badge">{company?.subscription_tier || 'trial'}</div>
          </div>
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Templates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tenders' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenders')}
        >
          📄 Tenders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
          onClick={() => setActiveTab('requirements')}
        >
          ⚙️ Requirements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          👥 Team
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="dashboard-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Welcome back, {user.email.split('@')[0]}!</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-details">
                  <h3>{templates.length}</h3>
                  <p>Templates</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-details">
                  <h3>{tenders.length}</h3>
                  <p>Tenders</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-details">
                  <h3>1</h3>
                  <p>Team Members</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-details">
                  <h3>14</h3>
                  <p>Trial Days Left</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('templates')} className="action-btn">
                  ➕ Create Template
                </button>
                <button onClick={() => setActiveTab('tenders')} className="action-btn">
                  📤 Upload Tender
                </button>
                <button className="action-btn">
                  👥 Invite Team
                </button>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <p className="no-activity">No recent activity</p>
            </div>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="templates-tab">
            <div className="tab-header">
              <h2>📋 Document Templates</h2>
              <button 
                className="create-btn"
                onClick={() => setShowTemplateForm(true)}
              >
                + New Template
              </button>
            </div>

            {showTemplateForm && (
              <div className="template-form-modal">
                <div className="modal-content">
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
                      rows="2"
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
                      rows="8"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                      placeholder={`Enter template content...\nUse {{company_name}} for dynamic variables`}
                    />
                    <small>Use &#123;&#123;variable&#125;&#125; for dynamic fields</small>
                  </div>

                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowTemplateForm(false)}>
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={handleCreateTemplate}
                      disabled={!newTemplate.name || !newTemplate.content}
                    >
                      Create Template
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="templates-grid">
              {templates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No templates yet</h3>
                  <p>Create your first template to get started</p>
                  <button 
                    className="create-first-btn"
                    onClick={() => setShowTemplateForm(true)}
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-icon">
                      {template.type === 'itt' ? '📄' : template.type === 'evaluation' ? '📊' : '📝'}
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description || 'No description'}</p>
                      <div className="template-meta">
                        <span className="template-type">{template.type}</span>
                        <span>v{template.version}</span>
                      </div>
                    </div>
                    <div className="template-actions">
                      <button className="icon-btn">✏️</button>
                      <button className="icon-btn">📋</button>
                      <button className="icon-btn">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

                {/* REQUIREMENTS TAB */}
        {activeTab === 'requirements' && (
          <div className="requirements-tab">
            <div className="tab-header">
              <h2>⚙️ Requirement Categories</h2>
              <button 
                className="create-btn"
                onClick={() => setShowCategoryForm(true)}
              >
                + New Category
              </button>
            </div>

            {/* Category Form Modal */}
            {showCategoryForm && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Create Category</h3>
                  
                  <div className="form-group">
                    <label>Category Name</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="e.g., Technical Requirements"
                    />
                  </div>

                  <div className="form-group">
                    <label>Icon</label>
                    <div className="icon-picker">
                      {['📋', '💰', '🛡️', '🌍', '⚙️', '🔧', '📊', '✅'].map(icon => (
                        <button
                          key={icon}
                          className={`icon-option ${newCategory.icon === icon ? 'selected' : ''}`}
                          onClick={() => setNewCategory({...newCategory, icon})}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                    />
                  </div>

                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowCategoryForm(false)}>
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={async () => {
                        await supabase
                          .from('requirement_categories')
                          .insert({
                            company_id: company.id,
                            name: newCategory.name,
                            icon: newCategory.icon,
                            color: newCategory.color
                          });
                        setShowCategoryForm(false);
                        setNewCategory({ name: '', icon: '📋', color: '#667eea' });
                        loadCategories();
                      }}
                      disabled={!newCategory.name}
                    >
                      Create Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="categories-grid">
              {categories.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No categories yet</h3>
                  <p>Create requirement categories to organize your rules</p>
                  <button 
                    className="create-first-btn"
                    onClick={() => setShowCategoryForm(true)}
                  >
                    Create Category
                  </button>
                </div>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="category-card" style={{ borderTop: `4px solid ${category.color}` }}>
                    <div className="category-header">
                      <span className="category-icon">{category.icon}</span>
                      <h3>{category.name}</h3>
                    </div>
                    <div className="category-stats">
                      {requirements.filter(r => r.category_id === category.id).length} requirements
                    </div>
                    <div className="category-actions">
                      <button className="icon-btn">✏️</button>
                      <button className="icon-btn">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="tab-header" style={{ marginTop: '40px' }}>
              <h2>📋 Requirement Templates</h2>
              <button 
                className="create-btn"
                onClick={() => setShowRequirementForm(true)}
                disabled={categories.length === 0}
              >
                + New Requirement
              </button>
              {categories.length === 0 && (
                <small className="hint">Create a category first</small>
              )}
            </div>

            {/* Requirement Form Modal */}
            {showRequirementForm && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Create Requirement</h3>
                  
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newRequirement.category_id}
                      onChange={(e) => setNewRequirement({...newRequirement, category_id: e.target.value})}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Requirement Name</label>
                    <input
                      type="text"
                      value={newRequirement.name}
                      onChange={(e) => setNewRequirement({...newRequirement, name: e.target.value})}
                      placeholder="e.g., ISO 9001 Certification"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newRequirement.description}
                      onChange={(e) => setNewRequirement({...newRequirement, description: e.target.value})}
                      placeholder="Describe what needs to be checked"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rule Type</label>
                    <select
                      value={newRequirement.rule_type}
                      onChange={(e) => setNewRequirement({...newRequirement, rule_type: e.target.value})}
                    >
                      <option value="text">Text/Description</option>
                      <option value="boolean">Yes/No (Checkbox)</option>
                      <option value="number">Number/Amount</option>
                      <option value="date">Date</option>
                      <option value="file">File/Certificate</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Mandatory?</label>
                      <input
                        type="checkbox"
                        checked={newRequirement.is_mandatory}
                        onChange={(e) => setNewRequirement({...newRequirement, is_mandatory: e.target.checked})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Weight (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newRequirement.weight}
                        onChange={(e) => setNewRequirement({...newRequirement, weight: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowRequirementForm(false)}>
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={async () => {
                        await supabase
                          .from('requirement_templates')
                          .insert({
                            company_id: company.id,
                            ...newRequirement
                          });
                        setShowRequirementForm(false);
                        setNewRequirement({
                          category_id: '',
                          name: '',
                          description: '',
                          rule_type: 'text',
                          is_mandatory: true,
                          weight: 1
                        });
                        loadRequirements();
                      }}
                      disabled={!newRequirement.category_id || !newRequirement.name}
                    >
                      Create Requirement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Grid */}
            <div className="requirements-grid">
              {requirements.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚙️</div>
                  <h3>No requirements yet</h3>
                  <p>Create requirements that bidders must comply with</p>
                </div>
              ) : (
                requirements.map(req => (
                  <div key={req.id} className="requirement-card">
                    <div className="requirement-header">
                      <span className="category-icon">{req.category?.icon || '📋'}</span>
                      <h4>{req.name}</h4>
                    </div>
                    <p className="requirement-description">{req.description}</p>
                    <div className="requirement-meta">
                      <span className="requirement-type">{req.rule_type}</span>
                      <span className={`badge ${req.is_mandatory ? 'mandatory' : 'optional'}`}>
                        {req.is_mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className="requirement-weight">Weight: {req.weight}</span>
                    </div>
                    <div className="requirement-actions">
                      <button className="icon-btn">✏️</button>
                      <button className="icon-btn">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TENDERS TAB */}
        {activeTab === 'tenders' && (
          <div className="tenders-tab">
            <div className="tab-header">
              <h2>📄 Tender Documents</h2>
              <button 
                className="create-btn"
                onClick={() => setShowTenderForm(true)}
              >
                + Upload Tender
              </button>
            </div>

            {showTenderForm && (
              <div className="tender-form-modal">
                <div className="modal-content">
                  <h3>Upload New Tender</h3>
                  
                  <div className="form-group">
                    <label>Tender Title</label>
                    <input
                      type="text"
                      value={newTender.title}
                      onChange={(e) => setNewTender({...newTender, title: e.target.value})}
                      placeholder="e.g., Construction Project Tender 2024"
                    />
                  </div>

                  <div className="form-group">
                    <label>Template (Optional)</label>
                    <select
                      value={newTender.template_id}
                      onChange={(e) => setNewTender({...newTender, template_id: e.target.value})}
                    >
                      <option value="">Select template</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={newTender.deadline}
                      onChange={(e) => setNewTender({...newTender, deadline: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Document</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        id="tender-file"
                      />
                      <label htmlFor="tender-file" className="file-label">
                        {newTender.file ? newTender.file.name : 'Choose File'}
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowTenderForm(false)}>
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={handleCreateTender}
                      disabled={uploading || !newTender.title}
                    >
                      {uploading ? 'Uploading...' : 'Upload Tender'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="tenders-grid">
              {tenders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <h3>No tenders yet</h3>
                  <p>Upload your first tender document to get started</p>
                  <button 
                    className="create-first-btn"
                    onClick={() => setShowTenderForm(true)}
                  >
                    Upload Tender
                  </button>
                </div>
              ) : (
                tenders.map(tender => (
  <div key={tender.id} className="tender-card">
    <div className="tender-icon">📄</div>
    <div className="tender-info">
      <h4>{tender.title}</h4>
      <p>Template: {tender.templates?.name || 'None'}</p>
      <div className="tender-meta">
        <span>Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>
        <span className={`status-badge ${tender.status}`}>
          {tender.status}
        </span>
      </div>
    </div>
    <div className="tender-actions">
      <button 
  className="icon-btn" 
  onClick={() => {
    if (window.confirm('Apply all requirements to this tender?')) {
      applyRequirementsToTender(tender.id);
    } else {
      viewRequirements(tender.id);
    }
  }}
  title="View/Apply Requirements"
>
  🔍
</button>
      <button className="icon-btn" title="Edit Tender">✏️</button>
      <button className="icon-btn" title="Duplicate">📋</button>
    </div>
  </div>
))
              )}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="team-tab">
            <div className="tab-header">
              <h2>👥 Team Members</h2>
              <button className="create-btn">+ Invite Member</button>
            </div>
            <div className="team-list">
              <div className="team-member">
                <div className="member-avatar">👤</div>
                <div className="member-info">
                  <h4>{user.email}</h4>
                  <p>Admin · You</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>⚙️ Company Settings</h2>
            
            <div className="settings-section">
              <h3>Company Information</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Company Name</label>
                  <p>{company?.name}</p>
                </div>
                <div className="setting-item">
                  <label>Company URL</label>
                  <p>{company?.slug}.tenderai.com</p>
                </div>
                <div className="setting-item">
                  <label>Industry</label>
                  <p>{company?.industry || 'Not set'}</p>
                </div>
                <div className="setting-item">
                  <label>Size</label>
                  <p>{company?.size || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Subscription</h3>
              <div className="subscription-card">
                <div className="plan-info">
                  <h4>{company?.subscription_tier || 'Trial'} Plan</h4>
                  <p>Expires: {new Date(company?.trial_ends_at).toLocaleDateString()}</p>
                </div>
                <button className="upgrade-btn">Upgrade Plan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await loadUserProfile(session.user);
        } else {
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) {
      await loadUserProfile(session.user);
    } else {
      setLoading(false);
    }
  };

  const loadUserProfile = async (user) => {
    setLoading(true);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile) {
      setProfile(profile);
      setCompany(profile.companies);
      
      // If user has no company, show setup
      if (!profile.companies) {
        setShowSetup(true);
      }
    }
    
    setLoading(false);
  };

  const handleSetupClick = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = (newCompany) => {
    setCompany(newCompany);
    setShowSetup(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <SimpleAuth onLogin={setSession} />;
  }

  if (showSetup) {
    return (
      <CompanySetup 
        user={session.user} 
        onComplete={handleSetupComplete}
      />
    );
  }

  return (
    <Dashboard 
      user={session.user} 
      company={company}
      onLogout={() => supabase.auth.signOut()}
      onSetupClick={handleSetupClick}
    />
  );
}

export default App;