import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Auth({ onLogin }) {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('sign-in'); // 'sign-in' or 'sign-up'

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        console.log('User logged in:', session.user);
        onLogin(session);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        setSession(session);
        if (session) onLogin(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [onLogin]);

  // If already logged in, show nothing (parent will handle)
  if (session) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🚀 Welcome to TenderAI</h2>
          <p>AI-Powered Tender Management Platform</p>
        </div>

        <div className="auth-mode-toggle">
          <button 
            className={`mode-btn ${authMode === 'sign-in' ? 'active' : ''}`}
            onClick={() => setAuthMode('sign-in')}
          >
            Sign In
          </button>
          <button 
            className={`mode-btn ${authMode === 'sign-up' ? 'active' : ''}`}
            onClick={() => setAuthMode('sign-up')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-form">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#667eea',
                    brandAccent: '#764ba2',
                  }
                }
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              }
            }}
            providers={['google', 'github']}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
            view={authMode === 'sign-in' ? 'sign_in' : 'sign_up'}
            showLinks={false}
          />
        </div>

        <div className="auth-footer">
          <p className="terms">
            By continuing, you agree to our 
            <a href="/terms"> Terms of Service</a> and 
            <a href="/privacy"> Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}