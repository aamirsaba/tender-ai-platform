import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import CompanySetup from './components/CompanySetup'; // <-- ADD THIS LINE
import './App.css';

// ... rest of your code
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

// Dashboard Component (YOUR CODE)
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

// Tender states - ADD THESE
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
    loadTenders(); // 👈 ADD THIS LINE
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

// Add this function AFTER loadTemplates
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

// Add this AFTER handleCreateTemplate
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setNewTender({...newTender, file, title: file.name});
};

// Add this AFTER handleFileUpload
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

// Add this function to view tender requirements
const viewRequirements = async (tenderId) => {
  try {
    // Fetch requirements for this tender
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
      // Show requirements in an alert for now (we'll make a modal later)
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
      </header>

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
                  <h3>0</h3>
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
                <button className="action-btn">
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
        onClick={() => viewRequirements(tender.id)}
        title="View Requirements"
      >
        🔍
      </button>
      <button className="icon-btn" title="Edit Tender">✏️</button>
      <button className="icon-btn" title="Duplicate">📋</button>
    </div>
  </div>
))
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

// ✅ THIS IS THE CRITICAL LINE YOU WERE MISSING!
export default App;