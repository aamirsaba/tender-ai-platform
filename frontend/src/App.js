import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
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
        alert('Check your email for confirmation!');
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

// Main App Component
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <SimpleAuth onLogin={setSession} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🚀 TenderAI</h1>
          <div className="user-info">
            <span>Welcome, {session.user.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard">
        <h2>Your Tender Dashboard</h2>
        <p>You're successfully logged in! Next steps:</p>
        <ul className="next-steps">
          <li>✅ Authentication working</li>
          <li>⬜ Set up company profile</li>
          <li>⬜ Upload templates</li>
          <li>⬜ Analyze tenders</li>
        </ul>
      </div>
    </div>
  );
}

export default App;