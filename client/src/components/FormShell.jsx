/**
 * @file FormShell.jsx
 * @description Standardized form wrapper container component.
 * Provides a uniform header, content body container, and action footer
 * with Cancel and Save action buttons and loading states.
 * @module components/FormShell
 */

import React from 'react';
import '../styles/components.css';

/**
 * Renders a standardized form shell with header title and save/cancel actions.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.title - Form card heading title.
 * @param {React.ReactNode} props.children - Form body fields and controls.
 * @param {function(): void} props.onSave - Callback triggered on form submission.
 * @param {function(): void} props.onCancel - Callback triggered when Cancel button is clicked.
 * @param {boolean} [props.isSaving=false] - Flag indicating active save request in progress.
 * @returns {JSX.Element} Form container layout.
 */
export default function FormShell({ title, children, onSave, onCancel, isSaving = false }) {
  /**
   * Prevents default browser submission and triggers the onSave handler.
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave();
  };

  return (
    <div className="form-shell">
      <div className="form-shell-header">
        <h2>{title}</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-shell-body">
          {children}
        </div>
        
        <div className="form-shell-footer">
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="primary-btn"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
