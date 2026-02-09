import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const GuardTouringManager = ({ building }) => {
    const {
        user,
        isAdmin,
        canViewGuardLog,
        canAddGuardTag,
        canEditGuardTag
    } = useAuth();

    const [logs, setLogs] = useState([]);
    const [mapping, setMapping] = useState([]);

    // UI Toggles
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditList, setShowEditList] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        tagId: '',
        location: '',
        floor: ''
    });

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
    const apiBase = `${API_BASE}/guard`;

    // Fetch logs (wrapped in effect)
    useEffect(() => {
        if (!isAdmin() && !canViewGuardLog()) {
            return; // Don't fetch if no view access
        }
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [building, user]); // Re-fetch when building or user changes (removed unstable function deps)

    useEffect(() => {
        if ((isAdmin() || canEditGuardTag()) && showEditList) {
            fetchMappings();
        }
    }, [user, building, showEditList]); // Removed unstable function deps

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${apiBase}/logs?building=${building}`, { withCredentials: true });
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching logs", error);
        }
    };

    const fetchMappings = async () => {
        try {
            const res = await axios.get(`${apiBase}/mapping?building=${building}`, { withCredentials: true });
            if (res.data.success) {
                setMapping(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching mapping", error);
        }
    };

    const handleAddTag = async (e) => {
        e.preventDefault();
        try {
            if (!formData.tagId || !formData.location || !formData.floor) {
                alert("All fields are required");
                return;
            }

            const payload = { ...formData, building };
            await axios.post(`${apiBase}/mapping`, payload, { withCredentials: true });
            alert("Tag added successfully!");
            setFormData({ tagId: '', location: '', floor: '' });
            fetchMappings(); // Refresh if list is open
        } catch (error) {
            alert(error.response?.data?.error || "Error adding tag");
        }
    };

    const handleEditMapping = async (id, updatedData) => {
        try {
            await axios.put(`${apiBase}/mapping/${id}`, updatedData, { withCredentials: true });
            fetchMappings();
        } catch (error) {
            alert("Error updating mapping");
        }
    };

    const handleDeleteMapping = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tag?")) return;
        try {
            await axios.delete(`${apiBase}/mapping/${id}`, { withCredentials: true });
            fetchMappings();
        } catch (error) {
            alert("Error deleting mapping");
        }
    };

    // --- STYLES ---
    const containerStyle = {
        padding: '20px',
        backgroundColor: '#f1f5f9',
        minHeight: '100%',
        fontFamily: '"Inter", sans-serif',
        fontSize: '16px'
    };

    const headerBarStyle = {
        background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
        padding: '18px 30px',
        borderRadius: '12px',
        marginBottom: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
        color: 'white'
    };

    const headerTitleBoxStyle = {
        background: 'white',
        padding: '10px 20px',
        borderRadius: '8px'
    };

    const headerTitleStyle = {
        margin: 0,
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#334155'
    };

    const actionButtonStyle = {
        background: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 'bold',
        color: '#1e293b',
        border: 'none',
        cursor: 'pointer',
        marginLeft: '15px',
        fontSize: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        marginBottom: '25px'
    };

    const inputStyle = {
        padding: '12px 18px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        marginRight: '15px',
        flex: 1,
        fontSize: '16px'
    };

    const saveButtonStyle = {
        padding: '12px 25px',
        borderRadius: '8px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '16px',
        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
    };

    // Table Styling
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '16px',
        marginTop: '10px'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '18px',
        borderBottom: '2px solid #e2e8f0',
        color: '#1e293b',
        fontWeight: '800',
        textTransform: 'uppercase',
        fontSize: '14px',
        letterSpacing: '0.05em'
    };

    const tdStyle = {
        padding: '18px',
        borderBottom: '1px solid #f1f5f9',
        color: '#475569',
        fontWeight: '500'
    };

    return (
        <div style={containerStyle}>

            {/* HEADER BAR */}
            <div style={headerBarStyle}>
                <div style={headerTitleBoxStyle}>
                    <h2 style={headerTitleStyle}>
                        Guard Touring Log Dashboard
                        <span style={{ marginLeft: '10px', fontWeight: 'normal', fontSize: '16px', color: '#64748b' }}>
                            - Building Name: <strong>{building}</strong>
                        </span>
                    </h2>
                </div>

                <div style={{ display: 'flex' }}>
                    {(isAdmin() || canAddGuardTag()) && (
                        <button
                            style={{ ...actionButtonStyle, backgroundColor: showAddForm ? '#e2e8f0' : 'white' }}
                            onClick={() => { setShowAddForm(!showAddForm); setShowEditList(false); }}
                        >
                            {showAddForm ? "Close Add Tag" : "Add Tag"}
                        </button>
                    )}
                    {(isAdmin() || canEditGuardTag()) && (
                        <button
                            style={{ ...actionButtonStyle, backgroundColor: showEditList ? '#e2e8f0' : 'white' }}
                            onClick={() => { setShowEditList(!showEditList); setShowAddForm(false); }}
                        >
                            {showEditList ? "Close Edit Details" : "Edit Tag Details"}
                        </button>
                    )}
                </div>
            </div>

            {/* ADD TAG FORM (Toggle) */}
            {(isAdmin() || canAddGuardTag()) && showAddForm && (
                <div style={{ ...cardStyle }}>
                    <h3 style={{ marginBottom: '25px', color: '#334155', fontSize: '20px' }}>Add New Tag</h3>
                    <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Tag ID</label>
                            <input type="text" placeholder="Scan/Enter Tag ID" value={formData.tagId} onChange={e => setFormData({ ...formData, tagId: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Building</label>
                            <input type="text" value={building} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Location</label>
                            <input type="text" placeholder="Location Name" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Floor</label>
                            <input type="text" placeholder="Floor" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} style={inputStyle} />
                        </div>
                        <button type="submit" style={saveButtonStyle}>Save Tag</button>
                    </form>
                </div>
            )}

            {/* EDIT TAG DETAILS (Toggle) - TABLE VIEW */}
            {(isAdmin() || canEditGuardTag()) && showEditList && (
                <div style={{ ...cardStyle, borderTop: '4px solid #10b981' }}>
                    <h3 style={{ marginBottom: '25px', color: '#334155', fontSize: '20px' }}>Tag Details</h3>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ ...thStyle, width: '50px' }}>#</th>
                                    <th style={thStyle}>Tag ID</th>
                                    <th style={thStyle}>Building</th>
                                    <th style={thStyle}>Location</th>
                                    <th style={thStyle}>Floor</th>
                                    <th style={{ ...thStyle, width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mapping.map((m, index) => (
                                    <GuardMappingRow
                                        key={m.id}
                                        index={index}
                                        data={m}
                                        onUpdate={handleEditMapping}
                                        onDelete={handleDeleteMapping}
                                        tdStyle={tdStyle}
                                    />
                                ))}
                                {mapping.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '18px' }}>No tags registered yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Close button removed as per user request */}
                </div>
            )}

            {/* LOG DASHBOARD TABLE (Always Visible) */}
            <div style={cardStyle}>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ ...thStyle, borderRight: '1px solid #e2e8f0', width: '80px' }}>SNo</th>
                                <th style={{ ...thStyle, borderRight: '1px solid #e2e8f0' }}>Timestamp</th>
                                <th style={{ ...thStyle, borderRight: '1px solid #e2e8f0' }}>Name</th>
                                <th style={{ ...thStyle, borderRight: '1px solid #e2e8f0' }}>Location</th>
                                <th style={thStyle}>Floor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => {
                                // Format timestamp: yyyy-mm-dd hh:mm:ss
                                const formatTimestamp = (isoString) => {
                                    if (!isoString) return "";
                                    const date = new Date(isoString);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    const seconds = String(date.getSeconds()).padStart(2, '0');
                                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                                };

                                return (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ ...tdStyle, borderRight: '1px solid #f1f5f9', fontWeight: 'bold' }}>{index + 1}</td>
                                        <td style={{ ...tdStyle, borderRight: '1px solid #f1f5f9' }}>{formatTimestamp(log.timestamp)}</td>
                                        <td style={{ ...tdStyle, borderRight: '1px solid #f1f5f9' }}>{log.name}</td>
                                        <td style={{ ...tdStyle, borderRight: '1px solid #f1f5f9' }}>{log.location}</td>
                                        <td style={tdStyle}>{log.floor}</td>
                                    </tr>
                                );
                            })}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', padding: '50px', color: '#cbd5e1', fontSize: '18px' }}>
                                        No logs available for {building}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

// Helper component for editable row as TABLE ROW (tr)
const GuardMappingRow = ({ index, data, onUpdate, onDelete, tdStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...data });

    const handleSave = () => {
        onUpdate(data.id, {
            // Tag ID is NOT editable
            location: editData.location,
            floor: editData.floor
        });
        setIsEditing(false);
    };

    const inputInline = {
        border: 'none',
        borderBottom: '2px solid #94a3b8',
        background: 'transparent',
        padding: '2px 5px',
        width: '100%',
        color: '#0f172a',
        fontWeight: '500',
        fontSize: '16px'
    };

    return (
        <tr style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ ...tdStyle, fontWeight: 'bold', width: '50px' }}>{index + 1}</td>

            <td style={tdStyle}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>{data.tagId}</span>
            </td>

            <td style={tdStyle}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>{data.building}</span>
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
                ) : (
                    <span style={{ fontWeight: '600' }}>{data.location}</span>
                )}
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.floor} onChange={e => setEditData({ ...editData, floor: e.target.value })} />
                ) : (
                    <span style={{ fontWeight: '600' }}>{data.floor}</span>
                )}
            </td>

            <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>✓</button>
                            <button onClick={() => setIsEditing(false)} style={{ color: 'gray', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Edit">
                                ✏️
                            </button>
                            <button onClick={() => onDelete(data.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Delete">
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default GuardTouringManager;
