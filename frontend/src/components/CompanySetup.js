import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CompanySetup({ onComplete, user }) {
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    slug: '',
    industry: '',
    size: ''
  });
  const [slugAvailable, setSlugAvailable] = useState(true);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug) return false;
    const { data, error } = await supabase
      .from('companies')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    
    return !data;
  };

  const handleNameChange = async (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    const available = await checkSlugAvailability(slug);
    
    setCompanyData({
      ...companyData,
      name,
      slug
    });
    setSlugAvailable(available);
  };

  const handleSlugChange = async (e) => {
    const slug = generateSlug(e.target.value);
    const available = await checkSlugAvailability(slug);
    
    setCompanyData({
      ...companyData,
      slug
    });
    setSlugAvailable(available);
  };

  const handleCreateCompany = async () => {
    setLoading(true);
    
    try {
      console.log('1. Creating company with data:', companyData);
      
      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          slug: companyData.slug,
          industry: companyData.industry,
          size: companyData.size,
          subscription_tier: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        })
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        throw companyError;
      }
      
      console.log('2. Company created:', company);

      // 2. Update user profile with company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      
      console.log('3. Profile updated successfully');
      
      onComplete(company);
      
    } catch (error) {
      console.error('Setup error details:', error);
      alert('Error setting up company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h2>Set Up Your Company</h2>
        <p className="setup-desc">Create your workspace to start using TenderAI</p>

        <div className="form-group">
          <label>Company Name *</label>
          <input
            type="text"
            value={companyData.name}
            onChange={handleNameChange}
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
              onChange={handleSlugChange}
              placeholder="your-company"
            />
            <span>.tenderai.com</span>
          </div>
          {companyData.slug && (
            <small className={slugAvailable ? 'available' : 'taken'}>
              {slugAvailable ? '✓ Available' : '✗ Not available'}
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
              <option value="">Select</option>
              <option value="oil-gas">Oil & Gas</option>
              <option value="construction">Construction</option>
              <option value="technology">Technology</option>
            </select>
          </div>

          <div className="form-group">
            <label>Company Size</label>
            <select
              value={companyData.size}
              onChange={(e) => setCompanyData({...companyData, size: e.target.value})}
            >
              <option value="">Select</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>
        </div>

        <button 
          className="create-btn"
          onClick={handleCreateCompany}
          disabled={loading || !companyData.name || !companyData.slug || !slugAvailable}
        >
          {loading ? 'Creating...' : '🚀 Create Workspace'}
        </button>
      </div>
    </div>
  );
}