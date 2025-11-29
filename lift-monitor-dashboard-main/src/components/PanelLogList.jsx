import React, { useState, useEffect } from 'react';
import { fetchPanelLogs, deletePanelLog } from '../services/api';
import { buildings } from '../config/buildings';
import './PanelLogList.css';

const PanelLogList = ({ onEdit, onCreateNew }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPanelType, setFilterPanelType] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [viewMode, setViewMode] = useState('daily');
  const [modalLog, setModalLog] = useState(null);
  const [modalPanelType, setModalPanelType] = useState('BOTH');
  const [dailyViewDate, setDailyViewDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [filterMode, setFilterMode] = useState('today');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFilterDateFrom(today);
    setFilterDateTo(today);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
      loadLogs();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filterBuilding, filterDateFrom, filterDateTo, filterPanelType, filterTime]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (filterBuilding) filters.building = filterBuilding;
      if (filterDateFrom) filters.dateFrom = filterDateFrom;
      if (filterDateTo) filters.dateTo = filterDateTo;
      if (filterPanelType) filters.panelType = filterPanelType;
      if (filterTime) filters.time = filterTime;
      
      const data = await fetchPanelLogs(filters);
      setLogs(data);
    } catch (err) {
      setError('Failed to load panel logs: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, panelType = null) => {
    const confirmMessage = panelType 
      ? `Are you sure you want to delete the ${panelType} panel data? ${logs.find(l => l.id === id)?.panelType === 'BOTH' ? 'The other panel data will be kept.' : 'This will delete the entire entry.'}`
      : 'Are you sure you want to delete this panel log?';
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await deletePanelLog(id, panelType);
      
      if (result.fullyDeleted) {
        setLogs(logs.filter(log => log.id !== id));
      } else {
        loadLogs();
      }
    } catch (err) {
      alert('Failed to delete panel log: ' + err.message);
      console.error(err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  const handleCardClick = (log) => {
    setModalLog(log);
    setModalPanelType(log.panelType || 'BOTH');
  };

  const closeModal = () => {
    setModalLog(null);
    setModalPanelType('BOTH');
  };

  const handleDailyView = (date) => {
    setDailyViewDate(date);
    setSelectedTimeSlot('all');
  };

  const closeDailyView = () => {
    setDailyViewDate(null);
    setSelectedTimeSlot('all');
  };

  const getFilteredDailyLogs = () => {
    if (!dailyViewDate) return [];
    const dailyLogs = logs.filter(log => log.date === dailyViewDate);
    if (selectedTimeSlot === 'all') {
      return dailyLogs.sort((a, b) => a.time.localeCompare(b.time));
    }
    return dailyLogs.filter(log => log.time === selectedTimeSlot);
  };

  const getAvailableTimeSlots = () => {
    if (!dailyViewDate) return [];
    const slots = logs
      .filter(log => log.date === dailyViewDate)
      .map(log => log.time)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return slots;
  };

  const formatDateTime = (date, time) => {
    return `${new Date(date).toLocaleDateString()} ${time}`;
  };

  const handleExportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBuilding) params.append('building', filterBuilding);
      if (filterMode === 'today') {
        params.append('date', filterDateFrom);
      } else {
        if (filterDateFrom) params.append('dateFrom', filterDateFrom);
        if (filterDateTo) params.append('dateTo', filterDateTo);
      }
      if (filterPanelType) params.append('panelType', filterPanelType);
      if (filterTime) params.append('time', filterTime);

      const response = await fetch(`http://localhost:3001/api/panel-logs/export/excel?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Panel_Logs_${filterDateFrom || 'export'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export data: ' + error.message);
      console.error('Export error:', error);
    }
  };

  const handleExportToPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBuilding) params.append('building', filterBuilding);
      if (filterMode === 'today') {
        params.append('date', filterDateFrom);
      } else {
        if (filterDateFrom) params.append('dateFrom', filterDateFrom);
        if (filterDateTo) params.append('dateTo', filterDateTo);
      }
      if (filterPanelType) params.append('panelType', filterPanelType);
      if (filterTime) params.append('time', filterTime);

      const response = await fetch(`http://localhost:3001/api/panel-logs/export/pdf?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Panel_Logs_${filterDateFrom || 'export'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export PDF: ' + error.message);
      console.error('Export error:', error);
    }
  };

  const handleOpenModal = (log) => {
    setModalLog(log);
    setModalPanelType(log.panelType || 'BOTH');
  };

  if (loading) {
    return <div className="loading">Loading panel logs...</div>;
  }

  return (
    <div className="panel-log-list-container">
      <div className="list-header">
        <h2>HT/LT Panel Log Sheets</h2>
        <button className="btn btn-primary" onClick={onCreateNew}>
          + Create New Entry
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Filter Mode:</label>
          <select
            value={filterMode}
            onChange={(e) => {
              const mode = e.target.value;
              setFilterMode(mode);
              if (mode === 'today') {
                const today = new Date().toISOString().split('T')[0];
                setFilterDateFrom(today);
                setFilterDateTo(today);
              } else {
                setFilterDateFrom('');
                setFilterDateTo('');
              }
            }}
          >
            <option value="today">Today</option>
            <option value="range">Range-Based</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Building:</label>
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
          >
            <option value="">All Buildings</option>
            {buildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>
        </div>

        {filterMode === 'range' && (
          <>
            <div className="filter-group">
              <label>Date From:</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Date To:</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="filter-group">
          <label>Panel Type:</label>
          <select
            value={filterPanelType}
            onChange={(e) => setFilterPanelType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="HT">HT Only</option>
            <option value="LT">LT Only</option>
            <option value="BOTH">Both Panels</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Slot:</label>
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
          >
            <option value="">All Times</option>
            <option value="00:00">00:00</option>
            <option value="02:00">02:00</option>
            <option value="04:00">04:00</option>
            <option value="06:00">06:00</option>
            <option value="08:00">08:00</option>
            <option value="10:00">10:00</option>
            <option value="12:00">12:00</option>
            <option value="14:00">14:00</option>
            <option value="16:00">16:00</option>
            <option value="18:00">18:00</option>
            <option value="20:00">20:00</option>
            <option value="22:00">22:00</option>
          </select>
        </div>

        <div className="filter-group">
          <label>View Mode:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="daily">Daily View</option>
            <option value="cards">Time Wise Card View</option>
          </select>
        </div>

        {logs.length > 0 && (
          <>
            <button className="btn btn-export" onClick={handleExportToExcel}>
              📊 Export XLSX
            </button>
            <button className="btn btn-export" onClick={handleExportToPDF}>
              📄 Export PDF
            </button>
          </>
        )}

        <button className="btn btn-secondary" onClick={() => {
          setFilterBuilding('');
          setFilterDateFrom('');
          setFilterDateTo('');
          setFilterPanelType('');
          setFilterTime('');
          setFilterMode('today');
        }}>
          Clear Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {logs.length === 0 ? (
        <div className="no-data">
          <p>No panel logs found.</p>
          <button className="btn btn-primary" onClick={onCreateNew}>
            Create First Entry
          </button>
        </div>
      ) : viewMode === 'daily' ? (
        <div className="daily-view-container">
          {[...new Set(logs.map(log => log.date))].sort().reverse().map(date => {
            const dailyLogs = logs.filter(log => log.date === date).sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div key={date} className="daily-section">
                <div className="daily-section-header">
                  <h3>{new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h3>
                  <button 
                    className="btn btn-small" 
                    onClick={() => handleDailyView(date)}
                  >
                    View Full Table
                  </button>
                </div>

                {dailyLogs[0]?.htPanel && (
                  <div className="ht-table-section">
                    <h4>HT Panel</h4>
                    <div className="table-scroll-container">
                      <table className="panel-log-table daily-table">
                        <thead>
                          <tr>
                            <th rowSpan="3">Time (Hrs)</th>
                            <th rowSpan="3">I/C From TNEB</th>
                            <th colSpan="6">Main Incomer Supply</th>
                            <th colSpan="3">Out Going to Tr-1 (2000 Kva)</th>
                            <th colSpan="3">Out Going to Tr-2 (2000 Kva)</th>
                            <th colSpan="3">Out Going to Tr-3 (2000 Kva)</th>
                            <th rowSpan="3">REMARK</th>
                            <th rowSpan="3">ACTIONS</th>
                          </tr>
                          <tr>
                            <th colSpan="6">Current Amp</th>
                            <th colSpan="3">Current Amp & winding Temp.</th>
                            <th colSpan="3">Current Amp & winding Temp.</th>
                            <th colSpan="3">Current Amp & winding Temp.</th>
                          </tr>
                          <tr>
                            <th>Volt (kv)</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>PF</th>
                            <th>Hz</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyLogs.map(log => log.htPanel && (
                            <React.Fragment key={log.id}>
                              <tr>
                                <td rowSpan="2"><strong>{log.time}</strong></td>
                                <td rowSpan="2">{log.htPanel.icFromTneb || 'EB'}</td>
                                <td rowSpan="2">{log.htPanel.voltageFromWreb?.volt || '-'}</td>
                                <td rowSpan="2">{log.htPanel.currentAmp?.r || '-'}</td>
                                <td rowSpan="2">{log.htPanel.currentAmp?.y || '-'}</td>
                                <td rowSpan="2">{log.htPanel.currentAmp?.b || '-'}</td>
                                <td rowSpan="2">{log.htPanel.currentAmp?.pf || '-'}</td>
                                <td rowSpan="2">{log.htPanel.currentAmp?.hz || '-'}</td>
                                <td>{log.htPanel.outgoingTr1?.currentAmp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr1?.currentAmp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr1?.currentAmp?.b || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.currentAmp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.currentAmp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.currentAmp?.b || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.currentAmp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.currentAmp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.currentAmp?.b || '-'}</td>
                                <td rowSpan="2">{log.remarks || '-'}</td>
                                <td rowSpan="2">
                                  <div className="action-buttons">
                                    <button 
                                      className="update-btn"
                                      onClick={() => onEdit(log)}
                                      title="Update this log"
                                    >
                                      ✏️ Update
                                    </button>
                                    <button 
                                      className="delete-btn"
                                      onClick={() => handleDelete(log.id, 'HT')}
                                      title="Delete HT panel data"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>{log.htPanel.outgoingTr1?.windingTemp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr1?.windingTemp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr1?.windingTemp?.b || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.windingTemp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.windingTemp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr2?.windingTemp?.b || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.windingTemp?.r || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.windingTemp?.y || '-'}</td>
                                <td>{log.htPanel.outgoingTr3?.windingTemp?.b || '-'}</td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dailyLogs[0]?.ltPanel && (
                  <div className="lt-table-section">
                    <h4>LT Panel</h4>
                    <div className="table-scroll-container">
                      <table className="panel-log-table daily-table">
                        <thead>
                          <tr>
                            <th rowSpan="3">Time (Hrs)</th>
                            <th colSpan="8">Incomer -1 (From -Tr-1)</th>
                            <th colSpan="8">Incomer -2 (From -Tr-2)</th>
                            <th colSpan="8">Incomer -3 (From -Tr-3)</th>
                            <th rowSpan="3">ACTIONS</th>
                          </tr>
                          <tr>
                            <th colSpan="3">Voltage</th>
                            <th colSpan="3">Current Amp</th>
                            <th rowSpan="2">TAP No.</th>
                            <th rowSpan="2">KWH</th>
                            <th colSpan="3">Voltage</th>
                            <th colSpan="3">Current Amp</th>
                            <th rowSpan="2">TAP No.</th>
                            <th rowSpan="2">KWH</th>
                            <th colSpan="3">Voltage</th>
                            <th colSpan="3">Current Amp</th>
                            <th rowSpan="2">TAP No.</th>
                            <th rowSpan="2">KWH</th>
                          </tr>
                          <tr>
                            <th>RY</th>
                            <th>YB</th>
                            <th>BR</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>RY</th>
                            <th>YB</th>
                            <th>BR</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>RY</th>
                            <th>YB</th>
                            <th>BR</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyLogs.map(log => log.ltPanel && (
                            <tr key={log.id}>
                              <td><strong>{log.time}</strong></td>
                              <td>{log.ltPanel.incomer1?.voltage?.ry || '-'}</td>
                              <td>{log.ltPanel.incomer1?.voltage?.yb || '-'}</td>
                              <td>{log.ltPanel.incomer1?.voltage?.br || '-'}</td>
                              <td>{log.ltPanel.incomer1?.currentAmp?.r || '-'}</td>
                              <td>{log.ltPanel.incomer1?.currentAmp?.y || '-'}</td>
                              <td>{log.ltPanel.incomer1?.currentAmp?.b || '-'}</td>
                              <td>{log.ltPanel.incomer1?.tap || '-'}</td>
                              <td>{log.ltPanel.incomer1?.kwh || '-'}</td>
                              <td>{log.ltPanel.incomer2?.voltage?.ry || '-'}</td>
                              <td>{log.ltPanel.incomer2?.voltage?.yb || '-'}</td>
                              <td>{log.ltPanel.incomer2?.voltage?.br || '-'}</td>
                              <td>{log.ltPanel.incomer2?.currentAmp?.r || '-'}</td>
                              <td>{log.ltPanel.incomer2?.currentAmp?.y || '-'}</td>
                              <td>{log.ltPanel.incomer2?.currentAmp?.b || '-'}</td>
                              <td>{log.ltPanel.incomer2?.tap || '-'}</td>
                              <td>{log.ltPanel.incomer2?.kwh || '-'}</td>
                              <td>{log.ltPanel.incomer3?.voltage?.ry || '-'}</td>
                              <td>{log.ltPanel.incomer3?.voltage?.yb || '-'}</td>
                              <td>{log.ltPanel.incomer3?.voltage?.br || '-'}</td>
                              <td>{log.ltPanel.incomer3?.currentAmp?.r || '-'}</td>
                              <td>{log.ltPanel.incomer3?.currentAmp?.y || '-'}</td>
                              <td>{log.ltPanel.incomer3?.currentAmp?.b || '-'}</td>
                              <td>{log.ltPanel.incomer3?.tap || '-'}</td>
                              <td>{log.ltPanel.incomer3?.kwh || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="update-btn"
                                    onClick={() => onEdit(log)}
                                    title="Update this log"
                                  >
                                    ✏️ Update
                                  </button>
                                  <button 
                                    className="delete-btn"
                                    onClick={() => handleDelete(log.id, 'LT')}
                                    title="Delete LT panel data"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="logs-grid">
          {logs.map(log => (
            <div key={log.id} className="log-card" onClick={() => handleCardClick(log)}>
              <div className="log-card-header">
                <div className="log-info">
                  <h3>{log.building}</h3>
                  <p className="log-datetime">{formatDateTime(log.date, log.time)}</p>
                  <span className="panel-type-badge">{log.panelType}</span>
                </div>
                <div className="log-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(log)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(log.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalLog && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalLog.building} - {formatDateTime(modalLog.date, modalLog.time)}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-panel-selector">
              <label>Select Panel to View:</label>
              <select 
                value={modalPanelType} 
                onChange={(e) => setModalPanelType(e.target.value)}
                className="panel-selector"
              >
                {(modalLog.panelType === 'BOTH' || modalLog.panelType === 'HT') && (
                  <option value="HT">HT Panel Only</option>
                )}
                {(modalLog.panelType === 'BOTH' || modalLog.panelType === 'LT') && (
                  <option value="LT">LT Panel Only</option>
                )}
                {modalLog.panelType === 'BOTH' && (
                  <option value="BOTH">Both Panels</option>
                )}
              </select>
            </div>

            <div className="modal-body">
              {(modalPanelType === 'HT' || modalPanelType === 'BOTH') && modalLog.htPanel && (
                <div className="ht-table-section">
                  <h4>HT Panel</h4>
                  <div className="table-scroll-container">
                    <table className="panel-log-table">
                      <thead>
                        <tr>
                          <th rowSpan="3">Time (Hrs)</th>
                          <th rowSpan="3">I/C From TNEB</th>
                          <th colSpan="6">Main Incomer Supply</th>
                          <th colSpan="3">Out Going to Tr-1 (2000 Kva)</th>
                          <th colSpan="3">Out Going to Tr-2 (2000 Kva)</th>
                          <th colSpan="3">Out Going to Tr-3 (2000 Kva)</th>
                          <th rowSpan="3">REMARK</th>
                        </tr>
                        <tr>
                          <th colSpan="6">Current Amp</th>
                          <th colSpan="3">Current Amp & winding Temp.</th>
                          <th colSpan="3">Current Amp & winding Temp.</th>
                          <th colSpan="3">Current Amp & winding Temp.</th>
                        </tr>
                        <tr>
                          <th>Volt (kv)</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>PF</th>
                          <th>Hz</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td rowSpan="2">{modalLog.time}</td>
                          <td rowSpan="2">{modalLog.htPanel.icFromTneb || 'EB'}</td>
                          <td rowSpan="2">{modalLog.htPanel.voltageFromWreb?.volt || '-'}</td>
                          <td rowSpan="2">{modalLog.htPanel.currentAmp?.r || '-'}</td>
                          <td rowSpan="2">{modalLog.htPanel.currentAmp?.y || '-'}</td>
                          <td rowSpan="2">{modalLog.htPanel.currentAmp?.b || '-'}</td>
                          <td rowSpan="2">{modalLog.htPanel.currentAmp?.pf || '-'}</td>
                          <td rowSpan="2">{modalLog.htPanel.currentAmp?.hz || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr1?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr1?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr1?.currentAmp?.b || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.currentAmp?.b || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.currentAmp?.b || '-'}</td>
                          <td rowSpan="2">{modalLog.remarks || '-'}</td>
                        </tr>
                        <tr>
                          <td>{modalLog.htPanel.outgoingTr1?.windingTemp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr1?.windingTemp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr1?.windingTemp?.b || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.windingTemp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.windingTemp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr2?.windingTemp?.b || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.windingTemp?.r || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.windingTemp?.y || '-'}</td>
                          <td>{modalLog.htPanel.outgoingTr3?.windingTemp?.b || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(modalPanelType === 'LT' || modalPanelType === 'BOTH') && modalLog.ltPanel && (
                <div className="lt-table-section">
                  <h4>LT Panel</h4>
                  <div className="table-scroll-container">
                    <table className="panel-log-table">
                      <thead>
                        <tr>
                          <th rowSpan="3">Time (Hrs)</th>
                          <th colSpan="8">Incomer -1 (From -Tr-1)</th>
                          <th colSpan="8">Incomer -2 (From -Tr-2)</th>
                          <th colSpan="8">Incomer -3 (From -Tr-3)</th>
                        </tr>
                        <tr>
                          <th colSpan="3">Voltage</th>
                          <th colSpan="3">Current Amp</th>
                          <th rowSpan="2">TAP No.</th>
                          <th rowSpan="2">KWH</th>
                          <th colSpan="3">Voltage</th>
                          <th colSpan="3">Current Amp</th>
                          <th rowSpan="2">TAP No.</th>
                          <th rowSpan="2">KWH</th>
                          <th colSpan="3">Voltage</th>
                          <th colSpan="3">Current Amp</th>
                          <th rowSpan="2">TAP No.</th>
                          <th rowSpan="2">KWH</th>
                        </tr>
                        <tr>
                          <th>RY</th>
                          <th>YB</th>
                          <th>BR</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>RY</th>
                          <th>YB</th>
                          <th>BR</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>RY</th>
                          <th>YB</th>
                          <th>BR</th>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{modalLog.time}</td>
                          <td>{modalLog.ltPanel.incomer1?.voltage?.ry || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.voltage?.yb || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.voltage?.br || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.currentAmp?.b || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.tap || '-'}</td>
                          <td>{modalLog.ltPanel.incomer1?.kwh || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.voltage?.ry || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.voltage?.yb || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.voltage?.br || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.currentAmp?.b || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.tap || '-'}</td>
                          <td>{modalLog.ltPanel.incomer2?.kwh || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.voltage?.ry || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.voltage?.yb || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.voltage?.br || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.currentAmp?.r || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.currentAmp?.y || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.currentAmp?.b || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.tap || '-'}</td>
                          <td>{modalLog.ltPanel.incomer3?.kwh || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="modal-metadata">
                <p><strong>Shift Incharge:</strong> 
                  {modalLog.shiftIncharge?.aShift?.name && ` A: ${modalLog.shiftIncharge.aShift.name}`}
                  {modalLog.shiftIncharge?.bShift?.name && ` | B: ${modalLog.shiftIncharge.bShift.name}`}
                  {modalLog.shiftIncharge?.cShift?.name && ` | C: ${modalLog.shiftIncharge.cShift.name}`}
                  {!modalLog.shiftIncharge?.aShift?.name && !modalLog.shiftIncharge?.bShift?.name && !modalLog.shiftIncharge?.cShift?.name && '-'}
                </p>
                <p><strong>Power Failure:</strong> 
                  {modalLog.powerFailure?.fromHrs && modalLog.powerFailure?.toHrs 
                    ? `${modalLog.powerFailure.fromHrs} to ${modalLog.powerFailure.toHrs}${modalLog.powerFailure.reason ? ` (${modalLog.powerFailure.reason})` : ''}` 
                    : '-'}
                </p>
                {modalLog.remarks && <p><strong>Remarks:</strong> {modalLog.remarks}</p>}
                {modalLog.engineerSignature && <p><strong>Engineer Signature:</strong> {modalLog.engineerSignature}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {dailyViewDate && (
        <div className="modal-overlay" onClick={closeDailyView}>
          <div className="modal-content daily-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Daily View - {new Date(dailyViewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              <button className="modal-close" onClick={closeDailyView}>×</button>
            </div>

            <div className="modal-panel-selector">
              <label>Select Time Slot:</label>
              <select 
                value={selectedTimeSlot} 
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="panel-selector"
              >
                <option value="all">All Times (Full Day)</option>
                {getAvailableTimeSlots().map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div className="modal-body">
              {getFilteredDailyLogs().length === 0 ? (
                <p>No logs found for this date.</p>
              ) : (
                <>
                  {getFilteredDailyLogs()[0]?.htPanel && (
                    <div className="ht-table-section">
                      <h4>HT Panel</h4>
                      <div className="table-scroll-container">
                        <table className="panel-log-table daily-table">
                          <thead>
                            <tr>
                              <th rowSpan="3">Time (Hrs)</th>
                              <th rowSpan="3">I/C From TNEB</th>
                              <th colSpan="6">Main Incomer Supply</th>
                              <th colSpan="3">Out Going to Tr-1 (2000 Kva)</th>
                              <th colSpan="3">Out Going to Tr-2 (2000 Kva)</th>
                              <th colSpan="3">Out Going to Tr-3 (2000 Kva)</th>
                              <th rowSpan="3">REMARK</th>
                            </tr>
                            <tr>
                              <th colSpan="6">Current Amp</th>
                              <th colSpan="3">Current Amp & winding Temp.</th>
                              <th colSpan="3">Current Amp & winding Temp.</th>
                              <th colSpan="3">Current Amp & winding Temp.</th>
                            </tr>
                            <tr>
                              <th>Volt (kv)</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>PF</th>
                              <th>Hz</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredDailyLogs().map(log => log.htPanel && (
                              <React.Fragment key={log.id}>
                                <tr>
                                  <td rowSpan="2"><strong>{log.time}</strong></td>
                                  <td rowSpan="2">{log.htPanel.icFromTneb || 'EB'}</td>
                                  <td rowSpan="2">{log.htPanel.voltageFromWreb?.volt || '-'}</td>
                                  <td rowSpan="2">{log.htPanel.currentAmp?.r || '-'}</td>
                                  <td rowSpan="2">{log.htPanel.currentAmp?.y || '-'}</td>
                                  <td rowSpan="2">{log.htPanel.currentAmp?.b || '-'}</td>
                                  <td rowSpan="2">{log.htPanel.currentAmp?.pf || '-'}</td>
                                  <td rowSpan="2">{log.htPanel.currentAmp?.hz || '-'}</td>
                                  <td>{log.htPanel.outgoingTr1?.currentAmp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr1?.currentAmp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr1?.currentAmp?.b || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.currentAmp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.currentAmp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.currentAmp?.b || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.currentAmp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.currentAmp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.currentAmp?.b || '-'}</td>
                                  <td rowSpan="2">{log.remarks || '-'}</td>
                                </tr>
                                <tr>
                                  <td>{log.htPanel.outgoingTr1?.windingTemp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr1?.windingTemp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr1?.windingTemp?.b || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.windingTemp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.windingTemp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr2?.windingTemp?.b || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.windingTemp?.r || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.windingTemp?.y || '-'}</td>
                                  <td>{log.htPanel.outgoingTr3?.windingTemp?.b || '-'}</td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {getFilteredDailyLogs()[0]?.ltPanel && (
                    <div className="lt-table-section">
                      <h4>LT Panel</h4>
                      <div className="table-scroll-container">
                        <table className="panel-log-table daily-table">
                          <thead>
                            <tr>
                              <th rowSpan="3">Time (Hrs)</th>
                              <th colSpan="8">Incomer -1 (From -Tr-1)</th>
                              <th colSpan="8">Incomer -2 (From -Tr-2)</th>
                              <th colSpan="8">Incomer -3 (From -Tr-3)</th>
                            </tr>
                            <tr>
                              <th colSpan="3">Voltage</th>
                              <th colSpan="3">Current Amp</th>
                              <th rowSpan="2">TAP No.</th>
                              <th rowSpan="2">KWH</th>
                              <th colSpan="3">Voltage</th>
                              <th colSpan="3">Current Amp</th>
                              <th rowSpan="2">TAP No.</th>
                              <th rowSpan="2">KWH</th>
                              <th colSpan="3">Voltage</th>
                              <th colSpan="3">Current Amp</th>
                              <th rowSpan="2">TAP No.</th>
                              <th rowSpan="2">KWH</th>
                            </tr>
                            <tr>
                              <th>RY</th>
                              <th>YB</th>
                              <th>BR</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>RY</th>
                              <th>YB</th>
                              <th>BR</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>RY</th>
                              <th>YB</th>
                              <th>BR</th>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredDailyLogs().map(log => log.ltPanel && (
                              <tr key={log.id}>
                                <td><strong>{log.time}</strong></td>
                                <td>{log.ltPanel.incomer1?.voltage?.ry || '-'}</td>
                                <td>{log.ltPanel.incomer1?.voltage?.yb || '-'}</td>
                                <td>{log.ltPanel.incomer1?.voltage?.br || '-'}</td>
                                <td>{log.ltPanel.incomer1?.currentAmp?.r || '-'}</td>
                                <td>{log.ltPanel.incomer1?.currentAmp?.y || '-'}</td>
                                <td>{log.ltPanel.incomer1?.currentAmp?.b || '-'}</td>
                                <td>{log.ltPanel.incomer1?.tap || '-'}</td>
                                <td>{log.ltPanel.incomer1?.kwh || '-'}</td>
                                <td>{log.ltPanel.incomer2?.voltage?.ry || '-'}</td>
                                <td>{log.ltPanel.incomer2?.voltage?.yb || '-'}</td>
                                <td>{log.ltPanel.incomer2?.voltage?.br || '-'}</td>
                                <td>{log.ltPanel.incomer2?.currentAmp?.r || '-'}</td>
                                <td>{log.ltPanel.incomer2?.currentAmp?.y || '-'}</td>
                                <td>{log.ltPanel.incomer2?.currentAmp?.b || '-'}</td>
                                <td>{log.ltPanel.incomer2?.tap || '-'}</td>
                                <td>{log.ltPanel.incomer2?.kwh || '-'}</td>
                                <td>{log.ltPanel.incomer3?.voltage?.ry || '-'}</td>
                                <td>{log.ltPanel.incomer3?.voltage?.yb || '-'}</td>
                                <td>{log.ltPanel.incomer3?.voltage?.br || '-'}</td>
                                <td>{log.ltPanel.incomer3?.currentAmp?.r || '-'}</td>
                                <td>{log.ltPanel.incomer3?.currentAmp?.y || '-'}</td>
                                <td>{log.ltPanel.incomer3?.currentAmp?.b || '-'}</td>
                                <td>{log.ltPanel.incomer3?.tap || '-'}</td>
                                <td>{log.ltPanel.incomer3?.kwh || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelLogList;
