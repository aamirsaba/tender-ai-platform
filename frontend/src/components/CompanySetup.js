import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CompanySetup({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    slug: '',
    industry: '',
    size: '',
    website: ''
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const checkSlugAvailability = async (slug) => {
    const { data } = await supabase
      .from('companies')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    return !data;
  };

  const handleCreateCompany = async () => {
    setLoading(true);
    
    try {
      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          slug: companyData.slug,
          industry: companyData.industry,
          size: companyData.size,
          website: companyData.website,
          subscription_tier: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Create profile as admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          company_id: company.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: 'admin',
          permissions: {
            can_create_templates: true,
            can_edit_rules: true,
            can_invite_users: true,
            can_view_reports: true
          }
        });

      if (profileError) throw profileError;

      // 4. Create default templates
      await createDefaultTemplates(company.id);

      onComplete(company);
      
    } catch (error) {
      console.error('Setup error:', error);
      alert('Error setting up company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async (companyId) => {
    const defaultTemplates = [
      {
        company_id: companyId,
        name: 'Standard ITT',
        type: 'itt',
        content: {
          sections: [
            { title: 'Instructions to Bidders', content: '{{company_name}} invites bids for...' },
            { title: 'Scope of Work', content: 'The scope includes...' },
            { title: 'Evaluation Criteria', content: 'Bids will be evaluated on...' }
          ]
        },
        variables: ['company_name', 'project_name', 'deadline']
      },
      {
        company_id: companyId,
        name: 'Bid Evaluation Matrix',
        type: 'evaluation',
        content: {
          criteria: [
            { name: 'Technical', weight: 40 },
            { name: 'Commercial', weight: 30 },
            { name: 'ICV', weight: 20 },
            { name: 'HSSE', weight: 10 }
          ]
        }
      }
    ];

    await supabase.from('templates').insert(defaultTemplates);
  };

  if (step === 1) {
    return (
      <div className="setup-step">
        <h2>Create Your Company</h2>
        <p className="step-desc">Step 1: Company Information</p>
        
        <div className="form-group">
          <label>Company Name *</label>
          <input
            type="text"
            value={companyData.name}
            onChange={(e) => {
              const name = e.target.value;
              setCompanyData({
                ...companyData,
                name,
                slug: generateSlug(name)
              });
            }}
            placeholder="e.g., Oman LNG"
            required
          />
        </div>

        <div className="form-group">
          <label>Company URL *</label>
          <div className="slug-input">
            <span>https://</span>
            <input
              type="text"
              value={companyData.slug}
              onChange={async (e) => {
                const slug = generateSlug(e.target.value);
                const available = await checkSlugAvailability(slug);
                setCompanyData({
                  ...companyData,
                  slug,
                  slugAvailable: available
                });
              }}
              placeholder="your-company"
            />
            <span>.tenderai.com</span>
          </div>
          {companyData.slug && (
            <small className={companyData.slugAvailable ? 'available' : 'taken'}>
              {companyData.slugAvailable ? '✓ Available' : '✗ Not available'}
            </small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Industry</label>
            <select
              value={companyData.industry}
              onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
            >
              <option value="">Select industry</option>
              <option value="oil-gas">Oil & Gas</option>
              <option value="construction">Construction</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="government">Government</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Company Size</label>
            <select
              value={companyData.size}
              onChange={(e) => setCompanyData({...companyData, size: e.target.value})}
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="200+">200+ employees</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Website (optional)</label>
          <input
            type="url"
            value={companyData.website}
            onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
            placeholder="https://yourcompany.com"
          />
        </div>

        <button 
          className="next-btn"
          onClick={() => setStep(2)}
          disabled={!companyData.name || !companyData.slug || !companyData.slugAvailable}
        >
          Next: Branding →
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="setup-step">
        <h2>Brand Your Workspace</h2>
        <p className="step-desc">Step 2: Customize your company's look</p>

        <div className="branding-preview">
          <div 
            className="preview-card"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            <h3>{companyData.name}</h3>
            <p>tenderai.com/{companyData.slug}</p>
          </div>
        </div>

        <div className="color-pickers">
          <div className="color-input">
            <label>Primary Color</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
          <div className="color-input">
            <label>Secondary Color</label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
            />
          </div>
        </div>

        <div className="logo-upload">
          <label>Company Logo</label>
          <div className="upload-area">
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
            <p>Drag & drop or click to upload</p>
          </div>
        </div>

        <div className="button-group">
          <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
          <button 
            className="create-btn"
            onClick={handleCreateCompany}
            disabled={loading}
          >
            {loading ? 'Creating...' : '🚀 Launch My Company'}
          </button>
        </div>
      </div>
    );
  }
}