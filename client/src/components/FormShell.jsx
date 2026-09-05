import React from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import '../styles/components.css';
import '../styles/forms.css';

export default function FormShell({ title, children, onSave, onCancel, isSaving = false }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave();
  };

  return (
    <div className="fv-page">
      <div className="fv-topbar">
        <div className="fv-topbar-left">
          <button type="button" className="fv-btn fv-btn-back" onClick={onCancel}>
             <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="fv-topbar-title">{title}</h1>
            <p className="fv-topbar-subtitle">Fill in the details below</p>
          </div>
        </div>
        <div className="fv-topbar-actions">
           <button type="button" className="fv-btn fv-btn-ghost" onClick={onCancel}>
             <X size={16} /> Cancel
           </button>
           <button type="button" className="fv-btn fv-btn-save" onClick={handleSubmit} disabled={isSaving}>
             <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
           </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="fv-card">
          <div className="fv-card-body">
            {children}
          </div>
        </div>
      </form>
    </div>
  );
}
