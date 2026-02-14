import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // This line must be exactly as shown

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App /> {/* Make sure this is <App /> not <App> */}
  </React.StrictMode>
);