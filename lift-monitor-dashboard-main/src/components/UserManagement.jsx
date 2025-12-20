import React, { useState, useEffect } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/api";
import { buildings } from "../config/buildings";
import "./UserManagement.css";

const PRIVILEGES = ["view", "create", "edit", "delete"];
const LOG_TYPES = [
  { key: "panelLog", label: "HT/LT Panel Logs" },
  { key: "serviceLog", label: "Operator/Service Logs" },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    panelLogPrivileges: ["view"],
    serviceLogPrivileges: ["view"],
    assignedBuildings: [],
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      // Normalize users to ensure they have both privilege fields
      const normalizedData = data.map((user) => ({
        ...user,
        panelLogPrivileges: user.panelLogPrivileges || ["view"],
        serviceLogPrivileges: user.serviceLogPrivileges || ["view"],
      }));
      setUsers(normalizedData);
    } catch (err) {
      setError("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrivilegeChange = (logType, privilege) => {
    setFormData((prev) => {
      const key = `${logType}Privileges`;
      const currentPrivileges = prev[key] || ["view"];
      const privileges = currentPrivileges.includes(privilege)
        ? currentPrivileges.filter((p) => p !== privilege)
        : [...currentPrivileges, privilege];
      return { ...prev, [key]: privileges };
    });
  };

  const handleBuildingChange = (building) => {
    setFormData((prev) => {
      const assignedBuildings = prev.assignedBuildings.includes(building)
        ? prev.assignedBuildings.filter((b) => b !== building)
        : [...prev.assignedBuildings, building];
      return { ...prev, assignedBuildings };
    });
  };

  const handleSelectAllBuildings = () => {
    setFormData((prev) => ({
      ...prev,
      assignedBuildings:
        prev.assignedBuildings.length === buildings.length
          ? []
          : [...buildings],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          panelLogPrivileges: formData.panelLogPrivileges,
          serviceLogPrivileges: formData.serviceLogPrivileges,
          assignedBuildings: formData.assignedBuildings,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        console.log("Sending update data:", updateData); // Debug log
        await updateUser(editingUser.id, updateData);
        showMessage("User updated successfully!");
      } else {
        await createUser(formData);
        showMessage("User created successfully!");
      }
      loadUsers();
      resetForm();
      setShowForm(false);
    } catch (err) {
      showMessage("Error: " + err.message, "error");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      panelLogPrivileges: user.panelLogPrivileges || ["view"],
      serviceLogPrivileges: user.serviceLogPrivileges || ["view"],
      assignedBuildings: user.assignedBuildings || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      showMessage("User deleted successfully!");
      loadUsers();
    } catch (err) {
      showMessage("Error: " + err.message, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "user",
      panelLogPrivileges: ["view"],
      serviceLogPrivileges: ["view"],
      assignedBuildings: [],
    });
    setEditingUser(null);
  };

  const getRoleBadgeColor = (role) => {
    return role === "admin" ? "#ff9800" : "#2196f3";
  };

  return (
    <div className="user-management-container">
      {message && (
        <div className={`message-banner ${message.type}`}>{message.text}</div>
      )}

      <div className="user-management-header">
        <h2>👥 User Management</h2>
        <button
          className="btn-add-user"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "✕ Cancel" : "+ Add User"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="user-form-container">
          <form onSubmit={handleSubmit} className="user-form">
            <h3>{editingUser ? "Edit User" : "Create New User"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {editingUser
                    ? "New Password (leave blank to keep current)"
                    : "Password *"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Separate Privileges for Each Log Type */}
            {LOG_TYPES.map((logType) => (
              <div key={logType.key} className="form-group">
                <label>{logType.label} Privileges</label>
                <div className="checkbox-group">
                  {PRIVILEGES.map((privilege) => (
                    <label
                      key={`${logType.key}-${privilege}`}
                      className="checkbox-label"
                    >
                      <input
                        type="checkbox"
                        checked={(
                          formData[`${logType.key}Privileges`] || ["view"]
                        ).includes(privilege)}
                        onChange={() =>
                          handlePrivilegeChange(logType.key, privilege)
                        }
                      />
                      <span className="privilege-name">
                        {privilege.charAt(0).toUpperCase() + privilege.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="form-group">
              <label>
                Assigned Buildings
                <span className="hint">
                  (Leave empty for access to all buildings)
                </span>
              </label>
              <div className="checkbox-group buildings-group">
                <label className="checkbox-label select-all">
                  <input
                    type="checkbox"
                    checked={
                      formData.assignedBuildings.length === buildings.length
                    }
                    onChange={handleSelectAllBuildings}
                  />
                  <span>Select All / Deselect All</span>
                </label>
                {buildings.map((building) => (
                  <label key={building} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.assignedBuildings.includes(building)}
                      onChange={() => handleBuildingChange(building)}
                    />
                    <span>{building}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingUser ? "Update User" : "Create User"}
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
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Panel Log Privileges</th>
                <th>Service Log Privileges</th>
                <th>Assigned Buildings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="privilege-tags">
                      {user.panelLogPrivileges?.map((p) => (
                        <span key={p} className={`privilege-tag ${p}`}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="privilege-tags">
                      {user.serviceLogPrivileges?.map((p) => (
                        <span key={p} className={`privilege-tag ${p}`}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {user.assignedBuildings?.length === 0 ? (
                      <span className="all-buildings">All Buildings</span>
                    ) : (
                      <div className="building-tags">
                        {user.assignedBuildings?.map((b) => (
                          <span key={b} className="building-tag">
                            {b.replace("PRESTIGE ", "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(user)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(user.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
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

export default UserManagement;
