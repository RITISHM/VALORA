/**
 * @file DataTable.jsx
 * @description Reusable generic tabular data view component with real-time search filtering,
 * action toolbar (with optional "New [Entity]" creation trigger), and responsive horizontal scrolling.
 * @module components/DataTable
 */

import { useState } from 'react';
import { Search, Plus, LayoutGrid, List, ArrowLeft } from 'lucide-react';
import '../styles/components.css';

/**
 * Renders an interactive data table with search filtering and optional creation trigger.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.title - Entity title displayed in the creation button (e.g., "Contact", "Product").
 * @param {Array<Object>} props.columns - Column configuration schema.
 * @param {string} props.columns[].header - Table column header text.
 * @param {string} [props.columns[].accessor] - Object property key to read from row data.
 * @param {function(Object): React.ReactNode} [props.columns[].render] - Custom cell rendering callback.
 * @param {Array<Object>} props.data - Raw array of data row objects.
 * @param {function(): void} [props.onNewClick] - Callback handler invoked when "New [Entity]" button is clicked.
 * @param {function(): void} [props.onBack] - Callback handler for back navigation button.
 * @param {string} [props.searchPlaceholder="Search..."] - Placeholder text for the search input.
 * @param {boolean} [props.enableKanban=true] - Whether to enable kanban view toggle.
 * @param {function(Object): React.ReactNode} [props.kanbanRender] - Custom function to render a kanban card.
 * @returns {JSX.Element} Rendered table component with integrated search toolbar.
 */
export default function DataTable({ 
  title, 
  columns, 
  data, 
  onNewClick, 
  onBack,
  searchPlaceholder = "Search...",
  enableKanban = true,
  kanbanRender,
  renderKanbanCard,
  emptyStateIcon: EmptyIcon,
  emptyStateTitle,
  emptyStateMessage
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  const cardRenderer = kanbanRender || renderKanbanCard;

  /**
   * Filters input rows against current search query across all object properties.
   */
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="data-table-container">
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNewClick && (
            <button className="primary-btn" onClick={onNewClick}>
              <Plus size={18} />
              New {title}
            </button>
          )}
          {onBack && (
            <button className="secondary-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List / Kanban View Toggle */}
        {enableKanban && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <button 
              type="button"
              title="List View"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? '#0F172A' : '#64748B',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <List size={18} />
            </button>
            <button 
              type="button"
              title="Kanban View"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'kanban' ? '#0F172A' : '#64748B',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="valora-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx}>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="no-data">
                    {EmptyIcon || emptyStateTitle ? (
                      <div className="premium-empty-state">
                        {EmptyIcon && <EmptyIcon className="empty-icon" strokeWidth={1.5} />}
                        {emptyStateTitle && <h3>{emptyStateTitle}</h3>}
                        <p>{emptyStateMessage || "No records found."}</p>
                      </div>
                    ) : (
                      <div style={{ padding: '48px' }}>No records found.</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-cards-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px', 
          marginTop: '20px' 
        }}>
          {filteredData.length > 0 ? (
            filteredData.map((row, idx) => (
              cardRenderer ? cardRenderer(row) : (
                <div key={row.id || idx} style={{
                  background: '#FFFFFF',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: '#475569',
                    fontSize: '1.2rem',
                    overflow: 'hidden'
                  }}>
                    {row.image_url ? (
                      <img src={row.image_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      row.name ? row.name.substring(0, 2).toUpperCase() : '?'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>{row.name}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#64748B' }}>{row.email || row.type || ''}</p>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2563EB' }}>
                      {row.mobile ? row.mobile : row.sales_price !== undefined ? `₹ ${row.sales_price}` : ''}
                    </span>
                  </div>
                </div>
              )
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              {EmptyIcon || emptyStateTitle ? (
                <div className="premium-empty-state" style={{ padding: '80px 20px' }}>
                  {EmptyIcon && <EmptyIcon className="empty-icon" strokeWidth={1.5} />}
                  {emptyStateTitle && <h3>{emptyStateTitle}</h3>}
                  <p>{emptyStateMessage || "No records found."}</p>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  No records found.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
