import React, { useState, useEffect } from "react";
import {
  createServiceLog,
  fetchServiceLogs,
  updateServiceLog,
  deleteServiceLog,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ServiceLogManager.css";

const ServiceLogManager = () => {
  const { user, canCreate, canEdit, canDelete } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [formData, setFormData] = useState({
    sno: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date()
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .slice(0, 5),
    workOrderNo: "",
    natureOfCall: "Client call - oral",
    workDescription: "",
    status: "open",
    username: user?.name || "",
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceLogs();
      setLogs(data || []);
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
          lastUpdatedAt: new Date().toISOString(),
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
      date: new Date().toISOString().split("T")[0],
      time: new Date()
        .toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .slice(0, 5),
      workOrderNo: "",
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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortedLogs = () => {
    const sorted = [...logs].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      // Handle numeric sorting for sno and time
      if (sortConfig.key === "sno") {
        aVal = parseInt(a.sno);
        bVal = parseInt(b.sno);
      }

      if (sortConfig.key === "time") {
        aVal = a.time;
        bVal = b.time;
      }

      if (aVal === bVal) return 0;
      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      return sortConfig.direction === "asc" ? 1 : -1;
    });

    return sorted;
  };

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
      <div className="service-log-header">
        <h2>Operator Log Panel</h2>
        {canCreate() && (
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
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="service-log-form-container">
          <form onSubmit={handleSubmit} className="service-log-form">
            <div className="form-group">
              <label>Work Order No</label>
              <input
                type="text"
                name="workOrderNo"
                value={formData.workOrderNo}
                onChange={handleInputChange}
                placeholder="Enter work order number"
              />
            </div>

            <div className="form-group">
              <label>Nature of Call *</label>
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

      {loading ? (
        <div className="loading">Loading service logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          No service logs yet. Add one to get started!
        </div>
      ) : (
        <div className="service-logs-table">
          <table>
            <thead>
              <tr>
                <SortHeader field="sno" label="S.NO" />
                <SortHeader field="date" label="Date" />
                <SortHeader field="time" label="Time" />
                <SortHeader field="workOrderNo" label="Work Order No" />
                <SortHeader field="username" label="Username" />
                <SortHeader field="natureOfCall" label="Nature of Call" />
                <th>Work Description</th>
                <SortHeader field="status" label="Status" />
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedLogs().map((log) => (
                <tr key={log.id}>
                  <td>{log.sno}</td>
                  <td>
                    {new Date(log.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td>{log.time}</td>
                  <td>{log.workOrderNo || "-"}</td>
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
                  <td className="last-updated">
                    {log.lastUpdatedBy ? (
                      <>
                        <div>{log.lastUpdatedBy}</div>
                        <div className="update-time">
                          {new Date(log.lastUpdatedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}{" "}
                          {new Date(log.lastUpdatedAt).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )}
                        </div>
                        {log.changeDescription && (
                          <div className="change-description">
                            {log.changeDescription}
                          </div>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="actions">
                    {canEdit() && (
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(log)}
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {canDelete() && (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServiceLogManager;
