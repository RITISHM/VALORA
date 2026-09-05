import React from 'react';
import '../styles/components.css';

export default function FormShell({ title, children, onSave, onCancel, isSaving = false }) {
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
