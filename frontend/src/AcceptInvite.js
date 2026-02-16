import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AcceptInvite() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const acceptInvitation = async () => {
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No invitation token provided');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/accept-invite?token=${token}`);
        return;
      }

      // Fetch invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !invitation) {
        setStatus('error');
        setMessage('Invalid or expired invitation');
        return;
      }

      if (invitation.accepted_at) {
        setStatus('error');
        setMessage('This invitation has already been used');
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setStatus('error');
        setMessage('This invitation has expired');
        return;
      }

      // Update user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          company_id: invitation.company_id,
          role: invitation.role 
        })
        .eq('id', user.id);

      if (updateError) {
        setStatus('error');
        setMessage('Error accepting invitation');
        return;
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date() })
        .eq('id', invitation.id);

      setStatus('success');
      setMessage('✅ You have successfully joined the company!');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => navigate('/dashboard'), 3000);
    };

    acceptInvitation();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>🚀 TenderAI</h2>
          <p>Processing your invitation...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🚀 TenderAI</h2>
        <p className={status === 'success' ? 'success-message' : 'error-message'}>
          {message}
        </p>
        {status === 'success' && (
          <p>Redirecting to dashboard...</p>
        )}
        {status === 'error' && (
          <button onClick={() => navigate('/')} className="auth-button">
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
}