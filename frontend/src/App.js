import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import CompanySetup from './components/CompanySetup';
import './App.css';

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

function Dashboard({ user, company, onLogout }) {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🚀 {company ? company.name : 'TenderAI'}</h1>
          <div className="user-info">
            <span>Welcome, {user.email}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard">
        <h2>Your Tender Dashboard</h2>
        <p>You're successfully logged in! Next steps:</p>
        <ul className="next-steps">
          <li>✅ Authentication working</li>
          <li>{company ? '✅' : '⬜'} Set up company profile</li>
          <li>⬜ Upload templates</li>
          <li>⬜ Analyze tenders</li>
        </ul>

        {!company && (
          <div className="setup-prompt">
            <p>You haven't created a company yet.</p>
            <button onClick={() => window.location.reload()}>
              Set Up Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) await loadUserProfile(session.user);
        else {
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (user) => {
    setLoading(true);
    
    // Get profile with company
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', user.id)
      .single();
    
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
        onComplete={(newCompany) => {
          setCompany(newCompany);
          setShowSetup(false);
        }}
      />
    );
  }

  return (
    <Dashboard 
      user={session.user} 
      company={company}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}

export default App;