import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import CompanySetup from './components/CompanySetup';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) loadUserProfile(session.user.id);
        else {
          setCompany(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    setLoading(true);
    
    // Get profile with company
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', userId)
      .single();
    
    if (profile) {
      setProfile(profile);
      setCompany(profile.companies);
    }
    
    setLoading(false);
  };

  // If no session, show login
  if (!session) {
    return (
      <div className="app">
        <header className="header">
          <h1>🚀 TenderAI</h1>
          <p>Multi-Tenant AI-Powered Tender Management</p>
        </header>
        <div className="auth-wrapper">
          <Auth onLogin={setSession} />
        </div>
      </div>
    );
  }

  // If logged in but no company, show setup
  if (session && !company) {
    return (
      <div className="app">
        <header className="header">
          <h1>🚀 Welcome to TenderAI</h1>
          <p>Let's set up your company workspace</p>
        </header>
        <CompanySetup onComplete={(company) => {
          setCompany(company);
          loadUserProfile(session.user.id);
        }} />
      </div>
    );
  }

  // Show main dashboard with company context
  return (
    <div className="app" style={{
      '--primary': company?.settings?.brand_colors?.primary || '#667eea',
      '--secondary': company?.settings?.brand_colors?.secondary || '#764ba2'
    }}>
      <Dashboard 
        company={company} 
        profile={profile} 
        onLogout={() => supabase.auth.signOut()}
      />
    </div>
  );
}

export default App;