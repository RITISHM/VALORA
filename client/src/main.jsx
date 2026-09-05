/**
 * @file main.jsx
 * @description Application entry point. Mounts the React component tree into the DOM root element
 * wrapped with React.StrictMode for highlighting potential lifecycle and runtime issues.
 * @module main
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

/**
 * Initializes and renders the React application into the DOM container #root.
 */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);