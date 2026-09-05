/**
 * @file DataTable.jsx
 * @description Reusable generic tabular data view component with real-time search filtering,
 * action toolbar (with optional "New [Entity]" creation trigger), and responsive horizontal scrolling.
 * @module components/DataTable
 */

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
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
 * @param {string} [props.searchPlaceholder="Search..."] - Placeholder text for the search input.
 * @returns {JSX.Element} Rendered table component with integrated search toolbar.
 */
export default function DataTable({ title, columns, data, onNewClick, searchPlaceholder = "Search..." }) {
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {onNewClick && (
          <button className="primary-btn" onClick={onNewClick}>
            <Plus size={18} />
            New {title}
          </button>
        )}
      </div>

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
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
