import React from 'react';

export default function Dashboard({ company, profile, onLogout }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          {company.logo_url && (
            <img src={company.logo_url} alt={company.name} className="company-logo" />
          )}
          <div>
            <h1>{company.name} TenderAI</h1>
            <p className="company-slug">{company.slug}.tenderai.com</p>
          </div>
        </div>
        <div className="header-right">
          <span className="user-role">{profile.role}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="company-stats">
        <div className="stat-card">
          <h3>Tier</h3>
          <p className="stat-value">{company.subscription_tier}</p>
        </div>
        <div className="stat-card">
          <h3>Trial Ends</h3>
          <p className="stat-value">
            {new Date(company.trial_ends_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="main-content">
        <h2>Welcome to your workspace</h2>
        <p>You're all set up! Next steps:</p>
        <ul className="next-steps">
          <li>✅ Company created</li>
          <li>⬜ Upload your templates</li>
          <li>⬜ Configure evaluation rules</li>
          <li>⬜ Invite team members</li>
        </ul>
      </div>
    </div>
  );
}