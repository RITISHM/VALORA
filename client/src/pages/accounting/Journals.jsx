import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'SALES',
    default_account_id: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jData, aData] = await Promise.all([
        api.getJournals(),
        api.getChartOfAccounts()
      ]);
      setJournals(jData);
      setAccounts(aData);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Journal Name is required');
    if (!formData.default_account_id) return alert('Default Account is required');
    setIsSaving(true);
    try {
      await api.createJournal(formData);
      await loadData();
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save journal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ name: '', type: 'SALES', default_account_id: '' });
  };

  const columns = [
    { header: 'Journal Name', accessor: 'name' },
    { header: 'Type', render: (row) => (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '600',
        backgroundColor: '#F1F5F9',
        color: '#0F172A'
      }}>{row.type}</span>
    )},
    { header: 'Default Account', render: (row) => row.default_account?.name || '-' }
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title="New Journal" 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Journal Name *</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="E.g. Sales Journal" 
                required 
              />
            </div>
            <div className="form-field">
              <label>Journal Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="BANK">Bank</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Default Account *</label>
              <select 
                value={formData.default_account_id} 
                onChange={e => setFormData({...formData, default_account_id: e.target.value})}
                required
              >
                <option value="">-- Select Account from CoA --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>
          </div>
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Journals</h1>
      </div>
      {isLoading ? (
        <p>Loading journals...</p>
      ) : (
        <DataTable 
          title="Journal" 
          columns={columns} 
          data={journals} 
          onNewClick={() => setIsFormOpen(true)} 
          searchPlaceholder="Search journals..."
        />
      )}
    </div>
  );
}
