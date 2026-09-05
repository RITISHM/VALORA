import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.entry_date).toLocaleDateString() },
    { header: 'Reference', accessor: 'reference' },
    { header: 'Journal', render: (row) => row.journal?.name || '-' },
    { header: 'Status', render: (row) => (
      <span className={`status-badge ${row.status.toLowerCase()}`}>
        {row.status}
      </span>
    )},
    { header: 'Total', render: (row) => {
      // Calculate total debit from lines if available, otherwise just show -
      if (!row.journal_items || row.journal_items.length === 0) return '-';
      const total = row.journal_items.reduce((sum, item) => sum + item.debit, 0);
      return `₹ ${Number(total).toLocaleString()}`;
    }}
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Journal Entries</h1>
      </div>
      
      <DataTable 
        columns={columns} 
        data={entries} 
        isLoading={isLoading} 
      />
    </div>
  );
}
