import React, { useState, useEffect } from "react";
import {
  createServiceLog,
  fetchServiceLogs,
  updateServiceLog,
  deleteServiceLog,
} from "../services/api";
import { buildings } from "../config/buildings";
import { useAuth } from "../context/AuthContext";
import { getISTDate, getISTTime, getISTTimeString } from "../utils/timeUtils";
import "./ServiceLogManager.css";
import * as XLSX from "xlsx";

const ServiceLogManager = ({ building }) => {
  const {
    user,
    canCreateServiceLog,
    canEditServiceLog,
    canDeleteServiceLog,
    getAccessibleBuildings,
  } = useAuth();
  const accessibleBuildings = getAccessibleBuildings(buildings);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  // Prioritize prop, else default to first accessible
  const [filterBuilding, setFilterBuilding] = useState(
    building || accessibleBuildings[0] || ""
  );

  // Update filter if prop changes
  useEffect(() => {
    if (building) setFilterBuilding(building);
  }, [building]);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [formData, setFormData] = useState({
    sno: "",
    building: building || accessibleBuildings[0] || "",
    date: getISTDate(),
    time: getISTTimeString(),
    natureOfCall: "Client call - oral",
    workDescription: "",
    status: "open",
    username: user?.name || "",
  });

  // Operator Logs Filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterUsername, setFilterUsername] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceLogs();
      setLogs(data || []);
      setCurrentPage(1); // Reset page on data refetch
    } catch (err) {
      setError("Failed to load service logs: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLog) {
        await updateServiceLog(editingLog.id, {
          ...formData,
          lastUpdatedBy: user?.name || "",
          lastUpdatedAt: getISTTime().toISOString(),
        });
      } else {
        const nextSNo =
          logs.length > 0
            ? Math.max(...logs.map((l) => parseInt(l.sno) || 0)) + 1
            : 1;
        await createServiceLog({ ...formData, sno: nextSNo.toString() });
      }
      loadLogs();
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert("Error saving log: " + err.message);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData(log);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;

    try {
      await deleteServiceLog(id);
      loadLogs();
    } catch (err) {
      alert("Error deleting log: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      sno: "",
      building: filterBuilding || accessibleBuildings[0] || "",
      date: getISTDate(),
      time: getISTTimeString(),
      natureOfCall: "Client call - oral",
      workDescription: "",
      status: "open",
      username: user?.name || "",
    });
    setEditingLog(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#ff9800";
      case "closed":
        return "#4CAF50";
      case "pending":
        return "#f44336";
      default:
        return "#999";
    }
  };

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case "created":
        return "#2196F3";
      case "status_change":
        return "#9C27B0";
      case "nature_change":
        return "#FF5722";
      case "description_change":
        return "#607D8B";
      default:
        return "#999";
    }
  };

  const getChangeTypeLabel = (changeType) => {
    switch (changeType) {
      case "created":
        return "Created";
      case "status_change":
        return "Status";
      case "nature_change":
        return "Nature";
      case "description_change":
        return "Description";
      default:
        return changeType;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const formatterDate = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formatterTime = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${formatterDate.format(date)} ${formatterTime.format(date)}`;
  };

  const toggleExpand = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const handleExportToExcel = () => {
    const logsToExport = getSortedLogs();
    if (logsToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    const exportData = logsToExport.map((log, index) => {
      return {
        "S.No": index + 1,
        Building: log.building,
        Date: new Date(log.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        Time: log.time,
        Username: log.username,
        "Nature of Call": log.natureOfCall,
        "Work Description": log.workDescription,
        Status: log.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Operator Logs");
    XLSX.writeFile(
      workbook,
      `Operator_Logs_${filterBuilding}.xlsx`
    );
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortedLogs = () => {
    const filtered = logs.filter(
      (log) => {
        const passBuilding = !filterBuilding || log.building === filterBuilding;
        const passUsername = !filterUsername || log.username.toLowerCase().includes(filterUsername.toLowerCase());
        const passNature = !filterNature || log.natureOfCall === filterNature;
        const passStatus = !filterStatus || log.status === filterStatus;

        let passDate = true;
        if (filterDateFrom && filterDateTo) {
          const logDate = new Date(log.date);
          const fromDate = new Date(filterDateFrom);
          const toDate = new Date(filterDateTo);
          toDate.setHours(23, 59, 59);
          passDate = logDate >= fromDate && logDate <= toDate;
        }

        return passBuilding && passUsername && passNature && passStatus && passDate;
      }
    );

    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      // Handle numeric sorting for time
      if (sortConfig.key === "time") {
        aVal = a.time;
        bVal = b.time;
      }

      // Handle custom incremented SNO visual sort mapping if required
      if (sortConfig.key === "sno") {
        aVal = parseInt(a.sno);
        bVal = parseInt(b.sno);
      }

      if (aVal === bVal) return 0;
      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      return sortConfig.direction === "asc" ? 1 : -1;
    });

    return sorted;
  };

  const sortedFilteredLogs = getSortedLogs();
  const totalPages = Math.ceil(sortedFilteredLogs.length / itemsPerPage);
  const currentLogs = sortedFilteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortHeader = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className="sortable-header">
      <div className="header-content">
        {label}
        <span className="sort-indicator">
          {sortConfig.key === field
            ? sortConfig.direction === "asc"
              ? " ▲"
              : " ▼"
            : " ◆"}
        </span>
      </div>
    </th>
  );

  return (
    <div className="service-log-container">
      <div className="standard-header">
        <div>
          <h2>OPERATOR LOG PANEL</h2>
          <span className="subtitle">
            Building Name: <strong>{building}</strong>
          </span>
        </div>
        <div className="header-actions">
          {canCreateServiceLog() && (
            <button
              className="btn-add-log"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              {showForm ? "✕ Cancel" : "+ Add Log"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleExportToExcel} style={{ marginLeft: "10px" }}>
            Export Log as Excel
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="service-log-form-container">
          <form onSubmit={handleSubmit} className="service-log-form">
            <div className="form-group">
              <label>Building *</label>
              <input
                type="text"
                value={formData.building}
                disabled
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "2px solid #e0e0e0",
                  fontSize: "14px",
                  height: "45px",
                  boxSizing: "border-box",
                  width: "100%",
                  background: "#f8fafc",
                  color: "#94a3b8",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div className="form-group">
              <label>Nature of Call *</label>
              {editingLog ? (
                <input
                  type="text"
                  value={formData.natureOfCall}
                  disabled
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "2px solid #e0e0e0",
                    fontSize: "14px",
                    height: "45px",
                    boxSizing: "border-box",
                    width: "100%",
                    background: "#f8fafc",
                    color: "#94a3b8",
                    cursor: "not-allowed"
                  }}
                />
              ) : (
                <select
                  name="natureOfCall"
                  value={formData.natureOfCall}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Client call - oral">Client call - oral</option>
                  <option value="Client call - mail/portal">
                    Client call - mail/portal
                  </option>
                  <option value="AMC call">AMC call</option>
                  <option value="Routine activity">Routine activity</option>
                  <option value="Non routine activity">
                    Non routine activity
                  </option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Work Description *</label>
              <textarea
                name="workDescription"
                value={formData.workDescription}
                onChange={handleInputChange}
                placeholder="Enter work description"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              {!editingLog ? (
                <input
                  type="text"
                  value={formData.status.toUpperCase()}
                  disabled
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "2px solid #e0e0e0",
                    fontSize: "14px",
                    height: "45px",
                    boxSizing: "border-box",
                    width: "100%",
                    background: "#f8fafc",
                    color: "#94a3b8",
                    cursor: "not-allowed"
                  }}
                />
              ) : (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingLog ? "Update Log" : "Create Log"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-section">
        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date:</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Nature of Call:</label>
          <select
            value={filterNature}
            onChange={(e) => setFilterNature(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="Client call - oral">Client call - oral</option>
            <option value="Client call - mail/portal">Client call - mail/portal</option>
            <option value="AMC call">AMC call</option>
            <option value="Routine activity">Routine activity</option>
            <option value="Non routine activity">Non routine activity</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Username:</label>
          <input
            type="text"
            placeholder="Search username"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setFilterBuilding(building || accessibleBuildings[0] || "");
            setFilterDateFrom("");
            setFilterDateTo("");
            setFilterNature("");
            setFilterStatus("");
            setFilterUsername("");
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading service logs...</div>
      ) : (
        <div className="service-logs-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <SortHeader field="sno" label="S.NO" />
                <SortHeader field="date" label="Date" />
                <SortHeader field="time" label="Time" />
                <SortHeader field="username" label="Username" />
                <SortHeader field="natureOfCall" label="Nature of Call" />
                <th>Work Description</th>
                <SortHeader field="status" label="Status" />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                    No logs found for this selection
                  </td>
                </tr>
              ) : currentLogs.map((log, index) => {
                const pageSNO = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <React.Fragment key={log.id}>
                    {/* Main log row */}
                    <tr
                      className={expandedLogId === log.id ? "expanded-row" : ""}
                    >
                      <td>
                        {log.history && log.history.length > 0 && (
                          <button
                            className="btn-expand"
                            onClick={() => toggleExpand(log.id)}
                            title={
                              expandedLogId === log.id
                                ? "Hide History"
                                : "Show History"
                            }
                          >
                            {expandedLogId === log.id ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                      <td>{pageSNO}</td>
                      <td>
                        {new Date(log.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>{log.time}</td>
                      <td>{log.username}</td>
                      <td>
                        <span className="nature-badge">{log.natureOfCall}</span>
                      </td>
                      <td className="description">{log.workDescription}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(log.status) }}
                        >
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="actions">
                        {canEditServiceLog() && (
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(log)}
                            title="Edit"
                          >
                            ✎
                          </button>
                        )}
                        {canDeleteServiceLog() && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(log.id)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* History Rows expansion handling ... */}

                    {/* History rows */}
                    {expandedLogId === log.id &&
                      log.history &&
                      log.history.length > 0 && (
                        <tr className="history-container-row">
                          <td colSpan="11">
                            <div className="history-container">
                              <div className="history-header">
                                <span className="history-icon">📋</span> Change
                                History
                              </div>
                              <table className="history-table">
                                <thead>
                                  <tr>
                                    <th>Change Type</th>
                                    <th>Change Details</th>
                                    <th>Changed By</th>
                                    <th>Changed At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {log.history.map((historyItem) => (
                                    <tr
                                      key={historyItem.id}
                                      className="history-row"
                                    >
                                      <td>
                                        <span
                                          className="change-type-badge"
                                          style={{
                                            backgroundColor: getChangeTypeColor(
                                              historyItem.changeType
                                            ),
                                          }}
                                        >
                                          {getChangeTypeLabel(
                                            historyItem.changeType
                                          )}
                                        </span>
                                      </td>
                                      <td className="history-change-description">
                                        {historyItem.changeDescription}
                                      </td>
                                      <td>{historyItem.changedBy}</td>
                                      <td>
                                        {formatDateTime(historyItem.changedAt)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '10px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontWeight: '600', color: '#4b5563' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceLogManager;
