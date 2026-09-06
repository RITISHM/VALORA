import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function AnalyticAccounts() {
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalyticAccounts();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytic accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Analytic Name is required');
    setIsSaving(true);
    try {
      await api.createAnalyticAccount(formData);
      await loadData();
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save analytic account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ name: '', code: '', description: '' });
  };

  const columns = [
    { header: 'Code', accessor: 'code', render: (row) => <strong>{row.code || '-'}</strong> },
    { header: 'Analytic Account Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' }
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title="New Analytic Account" 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Analytic Account Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Project 1 - Urban Park" required />
            </div>
            <div className="form-field">
              <label>Code</label>
              <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="E.g. PRJ-001" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Description</label>
              <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Project description or tag" />
            </div>
          </div>
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Analytic Accounts</h1></div>
      {isLoading ? <p>Loading analytic accounts...</p> : (
        <DataTable title="Analytic Account" columns={columns} data={analytics} onNewClick={() => setIsFormOpen(true)} searchPlaceholder="Search analytic accounts..." />
      )}
    </div>
  );
}
