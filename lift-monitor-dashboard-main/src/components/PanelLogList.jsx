import React, { useState, useEffect } from 'react';
import { fetchPanelLogs, deletePanelLog, updatePanelLog } from '../services/api';
import { buildings } from '../config/buildings';
import { useAuth } from '../context/AuthContext';
import PowerFailureModal from './PowerFailureModal';
import './PanelLogList.css';

// API base URL for production/development
const API_BASE_URL = import.meta.env.VITE_API_BASE || "/api";

const PanelLogList = ({ onEdit, onCreateNew }) => {
  const { user, canDelete, getAccessibleBuildings } = useAuth();
  const accessibleBuildings = getAccessibleBuildings(buildings);
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
  const [powerFailureLog, setPowerFailureLog] = useState(null);
  const [showPowerFailureModal, setShowPowerFailureModal] = useState(false);
  const [remarksLogId, setRemarksLogId] = useState(null);
  const [remarksText, setRemarksText] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(false);

  // Helper function to safely get winding temp - handles both old (object) and new (string) formats
  const getSafeWindingTemp = (windingTemp) => {
    if (!windingTemp) return '-';
    if (typeof windingTemp === 'string' || typeof windingTemp === 'number') {
      return windingTemp || '-';
    }
    // Old format: object with r, y, b
    return '-';
  };

  // Helper function to safely get oil temp
  const getSafeOilTemp = (oilTemp) => {
    if (!oilTemp) return '-';
    if (typeof oilTemp === 'string' || typeof oilTemp === 'number') {
      return oilTemp || '-';
    }
    return '-';
  };

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

  const handleOpenPowerFailureModal = (log) => {
    setPowerFailureLog(log);
    setShowPowerFailureModal(true);
  };

  const handleSavePowerFailures = async (failures) => {
    if (!powerFailureLog) return;

    try {
      // Check if this is a daily power failure (id starts with 'daily-')
      if (powerFailureLog.id && powerFailureLog.id.startsWith("daily-")) {
        // Update all logs for this date
        const date = powerFailureLog.date;
        const dailyLogs = logs.filter((log) => log.date === date);

        if (dailyLogs.length === 0) {
          alert("No logs found for this date");
          return;
        }

        // Update all logs for this day with the same power failure
        const promises = dailyLogs.map((log) =>
          updatePanelLog(log.id, {
            powerFailure: failures.length > 0 ? failures : null,
          })
        );

        await Promise.all(promises);
      } else {
        // Update single log
        await updatePanelLog(powerFailureLog.id, {
          powerFailure: failures.length > 0 ? failures : null,
        });
      }

      setShowPowerFailureModal(false);
      setPowerFailureLog(null);

      loadLogs();
    } catch (err) {
      alert("Failed to save power failures: " + err.message);
      console.error(err);
    }
  };

  const handleClosePowerFailureModal = () => {
    setShowPowerFailureModal(false);
    setPowerFailureLog(null);
  };

  const handleCreatePowerFailureLog = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter((log) => log.date === today);

    // Get existing power failure from today's logs if any
    const existingPowerFailure =
      todayLogs.find((log) => log.powerFailure)?.powerFailure || [];

    // Create a virtual log entry for daily power failure
    setPowerFailureLog({
      id: `daily-${today}`,
      date: today,
      powerFailure: existingPowerFailure,
    });
    setShowPowerFailureModal(true);
  };

  const handleVerifyShiftIncharge = async (date) => {
    if (!user) {
      alert("You must be logged in to verify");
      return;
    }
    try {
      // Update all logs for this date
      const dailyLogs = logs.filter((log) => log.date === date);
      for (const log of dailyLogs) {
        await updatePanelLog(log.id, {
          shiftIncharge: user.name,
          lastUpdatedBy: user.name,
        });
      }
      loadLogs();
    } catch (err) {
      alert("Failed to verify shift incharge: " + err.message);
      console.error(err);
    }
  };

  const handleOpenRemarksModal = (date, currentRemarks) => {
    setRemarksLogId(date); // Store date instead of logId
    setRemarksText(currentRemarks || "");
    setShowRemarksModal(true);
  };

  const handleSaveRemarks = async () => {
    if (!remarksLogId) return;
    try {
      // Update all logs for this date
      const dailyLogs = logs.filter((log) => log.date === remarksLogId);
      for (const log of dailyLogs) {
        await updatePanelLog(log.id, {
          remarks: remarksText,
          lastUpdatedBy: user?.name,
        });
      }
      setShowRemarksModal(false);
      setRemarksLogId(null);
      setRemarksText("");
      loadLogs();
    } catch (err) {
      alert("Failed to save remarks: " + err.message);
      console.error(err);
    }
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setRemarksLogId(null);
    setRemarksText("");
  };

  if (loading) {
    return <div className="loading">Loading panel logs...</div>;
  }

  return (
    <div className="panel-log-list-container">
      <div className="list-header">
        <h2>HT/LT Panel Log Sheets</h2>
        <div className="header-buttons">
          {onCreateNew && (
            <button className="btn btn-primary" onClick={onCreateNew}>
              + Create New Entry
            </button>
          )}
          <button
            className="btn btn-warning"
            onClick={handleCreatePowerFailureLog}
          >
            Power Failure Log
          </button>
        </div>
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
          {onCreateNew && (
            <button className="btn btn-primary" onClick={onCreateNew}>
              Create First Entry
            </button>
          )}
        </div>
      ) : viewMode === 'daily' ? (
        <div className="daily-view-container">
          {[...new Set(logs.map(log => log.date))].sort().reverse().map(date => {
            const dailyLogs = logs.filter(log => log.date === date).sort((a, b) => a.time.localeCompare(b.time));
            const dailyPowerFailures = dailyLogs
              .flatMap(log => (log.powerFailure || [])
                .map(pf => ({ ...pf, logId: log.id })))
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            return (
              <div key={date} className="daily-section">
                <div className="daily-section-header">
                  <h3>{new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h3>
                  <div className="daily-header-actions">
                    <button 
                      className="btn btn-small" 
                      onClick={() => handleVerifyShiftIncharge(date)}
                      title="Verify as shift incharge"
                    >
                      ✓ Verify
                    </button>
                    <button 
                      className="btn btn-small" 
                      onClick={() => handleOpenRemarksModal(date, dailyLogs[0]?.remarks)}
                      title="Add remarks for this day"
                    >
                      📝 Add Remarks
                    </button>
                    <button 
                      className="btn btn-power-failure"
                      onClick={() => {
                        // Create a daily power failure log object
                        const dailyLog = {
                          id: `daily-${date}`,
                          date: date,
                          powerFailure: dailyLogs[0]?.powerFailure || [],
                          isDaily: true
                        };
                        handleOpenPowerFailureModal(dailyLog);
                      }}
                      title="Add power failure for this day"
                    >
                      ⚡ Add power failure
                    </button>
                    <button 
                      className="btn btn-small" 
                      onClick={() => handleDailyView(date)}
                    >
                      View Full Table
                    </button>
                  </div>
                </div>

                {dailyLogs[0]?.htPanel && (
                  <div className="ht-table-section">
                    <h4>HT Panel</h4>
                    <div className="table-scroll-container">
                      <table className="panel-log-table daily-table">
                        <thead>
                          <tr>
                            <th rowSpan="3">TIME (HRS)</th>
                            <th rowSpan="3">I/C FROM TNEB</th>
                            <th colSpan="6">MAIN INCOMER SUPPLY</th>
                            <th colSpan="5">OUT GOING TO TR-1 (2000 KVA)</th>
                            <th colSpan="5">OUT GOING TO TR-2 (2000 KVA)</th>
                            <th colSpan="5">OUT GOING TO TR-3 (2000 KVA)</th>
                            <th rowSpan="3">LAST UPDATED BY</th>
                            <th rowSpan="3">CREATED</th>
                            <th rowSpan="3">UPDATED</th>
                            <th rowSpan="3">ACTIONS</th>
                          </tr>
                          <tr>
                            <th rowSpan="2">VOLT (KV)</th>
                            <th colSpan="5">CURRENT AMP</th>
                            <th colSpan="3">CURRENT AMP</th>
                            <th colSpan="2">TEMP</th>
                            <th colSpan="3">CURRENT AMP</th>
                            <th colSpan="2">TEMP</th>
                            <th colSpan="3">CURRENT AMP</th>
                            <th colSpan="2">TEMP</th>
                          </tr>
                          <tr>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>P.F</th>
                            <th>HZ</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>Wind</th>
                            <th>Oil</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>Wind</th>
                            <th>Oil</th>
                            <th>R</th>
                            <th>Y</th>
                            <th>B</th>
                            <th>Wind</th>
                            <th>Oil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyLogs.map(log => log.htPanel && (
                            <tr key={log.id}>
                              <td><strong>{log.time}</strong></td>
                              <td>{log.htPanel.icFromTneb || 'EB'}</td>
                              <td>{log.htPanel.voltageFromWreb?.volt || '-'}</td>
                              <td>{log.htPanel.currentAmp?.r || '-'}</td>
                              <td>{log.htPanel.currentAmp?.y || '-'}</td>
                              <td>{log.htPanel.currentAmp?.b || '-'}</td>
                              <td>{log.htPanel.currentAmp?.pf || '-'}</td>
                              <td>{log.htPanel.currentAmp?.hz || '-'}</td>
                              <td>{log.htPanel.outgoingTr1?.currentAmp?.r || '-'}</td>
                              <td>{log.htPanel.outgoingTr1?.currentAmp?.y || '-'}</td>
                              <td>{log.htPanel.outgoingTr1?.currentAmp?.b || '-'}</td>
                              <td>{getSafeWindingTemp(log.htPanel.outgoingTr1?.windingTemp)}</td>
                              <td>{getSafeOilTemp(log.htPanel.outgoingTr1?.oilTemp)}</td>
                              <td>{log.htPanel.outgoingTr2?.currentAmp?.r || '-'}</td>
                              <td>{log.htPanel.outgoingTr2?.currentAmp?.y || '-'}</td>
                              <td>{log.htPanel.outgoingTr2?.currentAmp?.b || '-'}</td>
                              <td>{getSafeWindingTemp(log.htPanel.outgoingTr2?.windingTemp)}</td>
                              <td>{getSafeOilTemp(log.htPanel.outgoingTr2?.oilTemp)}</td>
                              <td>{log.htPanel.outgoingTr3?.currentAmp?.r || '-'}</td>
                              <td>{log.htPanel.outgoingTr3?.currentAmp?.y || '-'}</td>
                              <td>{log.htPanel.outgoingTr3?.currentAmp?.b || '-'}</td>
                              <td>{getSafeWindingTemp(log.htPanel.outgoingTr3?.windingTemp)}</td>
                              <td>{getSafeOilTemp(log.htPanel.outgoingTr3?.oilTemp)}</td>
                              <td>{log.lastUpdatedBy || '-'}</td>
                              <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                              <td>{log.updatedAt ? new Date(log.updatedAt).toLocaleString() : '-'}</td>
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
                                    onClick={() => handleDelete(log.id, 'HT')}
                                    title="Delete HT panel data"
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
                            <th rowSpan="3">LAST UPDATED BY</th>
                            <th rowSpan="3">CREATED</th>
                            <th rowSpan="3">UPDATED</th>
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
                              <td>{log.lastUpdatedBy || '-'}</td>
                              <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                              <td>{log.updatedAt ? new Date(log.updatedAt).toLocaleString() : '-'}</td>
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

                {/* Separate Display Section for Shift, Remarks, and Power Failures */}
                <div className="separate-section">
                  {/* Shift Incharge Display */}
                  <div className="shift-container">
                    <h4 className="section-title">Shift Incharge</h4>
                    <div className="section-content">
                      {dailyLogs.some(log => log.shiftIncharge) ? (
                        <p className="shift-info">{dailyLogs[0]?.shiftIncharge || '-'}</p>
                      ) : (
                        <p className="not-set">Not verified</p>
                      )}
                    </div>
                  </div>

                  {/* Remarks Display */}
                  <div className="remarks-container">
                    <h4 className="section-title">Remarks</h4>
                    <div className="section-content">
                      {dailyLogs.some(log => log.remarks) ? (
                        <p className="remarks-info">{dailyLogs[0]?.remarks || '-'}</p>
                      ) : (
                        <p className="not-set">No remarks</p>
                      )}
                    </div>
                  </div>

                  {/* Power Failures Display */}
                  <div className="power-failures-container">
                    <h4 className="section-title">Power Failures</h4>
                    <div className="section-content">
                      {dailyPowerFailures.length > 0 ? (
                        <div className="power-failures-list">
                          {dailyPowerFailures.map((pf, idx) => (
                            <div key={idx} className="power-failure-item">
                              <div className="failure-info">
                                <p>
                                  <strong>{pf.fromHrs} - {pf.toHrs}</strong>
                                  {pf.isFullDay && <span className="full-day-badge">Full Day</span>}
                                </p>
                                {pf.reason && <p className="reason">{pf.reason}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="not-set">-</p>
                      )}
                    </div>
                  </div>
                </div>
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
                          <th rowSpan="4">TIME (HRS)</th>
                          <th rowSpan="4">I/C FROM TNEB</th>
                          <th colSpan="6">MAIN INCOMER SUPPLY</th>
                          <th colSpan="3">OUT GOING TO TR-1 (2000 KVA)</th>
                          <th colSpan="3">OUT GOING TO TR-2 (2000 KVA)</th>
                          <th colSpan="3">OUT GOING TO TR-3 (2000 KVA)</th>
                          <th rowSpan="4">REMARK</th>
                        </tr>
                        <tr>
                          <th rowSpan="2">VOLT (KV)</th>
                          <th colSpan="5">CURRENT AMP</th>
                          <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                          <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                          <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                        </tr>
                        <tr>
                          <th>R</th>
                          <th>Y</th>
                          <th>B</th>
                          <th>P.F</th>
                          <th>HZ</th>
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
                        <tr>
                          <th></th>
                          <th></th>
                          <th></th>
                          <th></th>
                          <th></th>
                          <th></th>
                          <th colspan="3">CURRENT AMP</th>
                          <th colspan="3">WINDING TEMP.</th>
                          <th colspan="3">CURRENT AMP</th>
                          <th colspan="3">WINDING TEMP.</th>
                          <th colspan="3">CURRENT AMP</th>
                          <th colspan="3">WINDING TEMP.</th>
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
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr1?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr1?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr1?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr2?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr2?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr2?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr3?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr3?.windingTemp)}</td>
                          <td>{getSafeWindingTemp(modalLog.htPanel.outgoingTr3?.windingTemp)}</td>
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
                              <th rowSpan="4">TIME (HRS)</th>
                              <th rowSpan="4">I/C FROM TNEB</th>
                              <th colSpan="6">MAIN INCOMER SUPPLY</th>
                              <th colSpan="3">OUT GOING TO TR-1 (2000 KVA)</th>
                              <th colSpan="3">OUT GOING TO TR-2 (2000 KVA)</th>
                              <th colSpan="3">OUT GOING TO TR-3 (2000 KVA)</th>
                              <th rowSpan="4">REMARK</th>
                            </tr>
                            <tr>
                              <th rowSpan="2">VOLT (KV)</th>
                              <th colSpan="5">CURRENT AMP</th>
                              <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                              <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                              <th colSpan="3">CURRENT AMP & WINDING TEMP.</th>
                            </tr>
                            <tr>
                              <th>R</th>
                              <th>Y</th>
                              <th>B</th>
                              <th>P.F</th>
                              <th>HZ</th>
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
                            <tr>
                              <th></th>
                              <th></th>
                              <th></th>
                              <th></th>
                              <th></th>
                              <th></th>
                              <th colspan="3">CURRENT AMP</th>
                              <th colspan="3">WINDING TEMP.</th>
                              <th colspan="3">CURRENT AMP</th>
                              <th colspan="3">WINDING TEMP.</th>
                              <th colspan="3">CURRENT AMP</th>
                              <th colspan="3">WINDING TEMP.</th>
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
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr1?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr1?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr1?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr2?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr2?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr2?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr3?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr3?.windingTemp)}</td>
                                  <td>{getSafeWindingTemp(log.htPanel.outgoingTr3?.windingTemp)}</td>
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

      {showPowerFailureModal && powerFailureLog && (
        <PowerFailureModal
          logId={powerFailureLog.id}
          initialFailures={
            Array.isArray(powerFailureLog.powerFailure)
              ? powerFailureLog.powerFailure
              : powerFailureLog.powerFailure
              ? [powerFailureLog.powerFailure]
              : []
          }
          onSave={handleSavePowerFailures}
          onCancel={handleClosePowerFailureModal}
        />
      )}

      {showRemarksModal && (
        <div className="modal-overlay">
          <div className="modal-content remarks-modal">
            <div className="modal-header">
              <h2>Add Remarks</h2>
              <button className="modal-close" onClick={handleCloseRemarksModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder="Enter remarks here..."
                rows="6"
                className="remarks-textarea"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveRemarks}>
                Save Remarks
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCloseRemarksModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelLogList;
