import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

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
    }, [building, user]);

    useEffect(() => {
        if ((isAdmin() || canEditGuardTag()) && showEditList) {
            fetchMappings();
        }
    }, [user, building, showEditList]);

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

    const handleExportToExcel = () => {
        if (logs.length === 0) {
            alert("No logs available to export.");
            return;
        }

        const exportData = logs.map((log, index) => {
            const date = new Date(log.timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            return {
                "S.No": index + 1,
                "Timestamp": formattedTime,
                "Name": log.name,
                "Location": log.location,
                "Floor": log.floor
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Guard Logs");
        XLSX.writeFile(workbook, `Guard_Logs_${building}.xlsx`);
    };

    // --- STYLES (Matching ServiceLogManager / Operator Log) ---
    const containerStyle = {
        padding: '20px',
        backgroundColor: '#fff',
        minHeight: '100%',
        fontFamily: '"Inter", sans-serif',
        fontSize: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '3px solid #a076f9'
    };

    const titleStyle = {
        margin: 0,
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#1a1a1a'
    };

    // Main purple action button (Add Tag)
    const primaryButtonStyle = {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        marginLeft: '10px'
    };

    // Secondary button (Edit Tag Details) - maybe slightly different?
    // Let's keep consistent style but maybe different gradient or same
    const secondaryButtonStyle = {
        ...primaryButtonStyle,
        background: '#e0e0e0',
        color: '#333',
        boxShadow: 'none'
    };


    const cardStyle = {
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '25px',
        borderLeft: '4px solid #a076f9'
    };

    const inputStyle = {
        padding: '10px 12px',
        borderRadius: '6px',
        border: '2px solid #e0e0e0',
        marginRight: '15px',
        flex: 1,
        fontSize: '14px',
        transition: 'border-color 0.3s'
    };

    const saveButtonStyle = {
        ...primaryButtonStyle,
        padding: '10px 25px'
    };

    // Table Styling
    const tableContainerStyle = {
        width: '100%',
        overflowX: 'auto',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e0e0e0'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        background: 'white'
    };

    // Header Row Gradient
    const theadStyle = {
        background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)',
        color: 'white'
    };

    const thStyle = {
        padding: '15px',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '16px',
        letterSpacing: '0.5px',
        borderBottom: '1px solid #e0e0e0',
        color: 'white' // Override default dark text for header
    };

    const tdStyle = {
        padding: '12px 15px',
        borderBottom: '1px solid #f0f0f0',
        color: '#333',
        fontSize: '16px'
    };

    return (
        <div style={containerStyle}>

            {/* HEADER BAR (Clean White with Purple Underline) */}
            <div style={headerStyle}>
                <div>
                    <h2 style={titleStyle}>GUARD TOURING LOG PANEL</h2>
                    <span style={{ fontSize: '14px', color: '#666', marginTop: '5px', display: 'block' }}>
                        Building Name: <strong>{building}</strong>
                    </span>
                </div>

                <div style={{ display: 'flex' }}>
                    {(isAdmin() || canAddGuardTag()) && (
                        <button
                            style={primaryButtonStyle}
                            onClick={() => { setShowAddForm(!showAddForm); setShowEditList(false); }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 5px 15px rgba(160, 118, 249, 0.3)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        >
                            {showAddForm ? "Close Add Tag" : "+ Add Tag"}
                        </button>
                    )}
                    {(isAdmin() || canEditGuardTag()) && (
                        <button
                            style={{ ...primaryButtonStyle, background: '#6c757d' }} // Different color to distinguish
                            onClick={() => { setShowEditList(!showEditList); setShowAddForm(false); }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 5px 15px rgba(108, 117, 125, 0.3)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        >
                            {showEditList ? "Close Edit Details" : "✎ Edit Tag Details"}
                        </button>
                    )}
                    <button
                        style={{ ...secondaryButtonStyle, marginLeft: '10px' }}
                        onClick={handleExportToExcel}
                        onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                    >
                        Export Log as Excel
                    </button>
                </div>
            </div>

            {/* ADD TAG FORM (Toggle) */}
            {(isAdmin() || canAddGuardTag()) && showAddForm && (
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '18px' }}>Add New Tag</h3>
                    <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '600' }}>Tag ID</label>
                            <input type="text" placeholder="Scan/Enter Tag ID" value={formData.tagId} onChange={e => setFormData({ ...formData, tagId: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '600' }}>Building</label>
                            <input type="text" value={building} disabled style={{ ...inputStyle, background: '#f0f0f0', borderColor: '#ddd', color: '#777' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '600' }}>Location</label>
                            <input type="text" placeholder="Location Name" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '600' }}>Floor</label>
                            <input type="text" placeholder="Floor" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} style={inputStyle} />
                        </div>
                        <button type="submit" style={saveButtonStyle}>Save Tag</button>
                    </form>
                </div>
            )}

            {/* EDIT TAG DETAILS (Toggle) - TABLE VIEW */}
            {(isAdmin() || canEditGuardTag()) && showEditList && (
                <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '18px' }}>Tag Details</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={tableStyle}>
                            <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <tr>
                                    <th style={{ ...thStyle, color: '#333' }}>#</th>
                                    <th style={{ ...thStyle, color: '#333' }}>Tag ID</th>
                                    <th style={{ ...thStyle, color: '#333' }}>Building</th>
                                    <th style={{ ...thStyle, color: '#333' }}>Location</th>
                                    <th style={{ ...thStyle, color: '#333' }}>Floor</th>
                                    <th style={{ ...thStyle, color: '#333', width: '100px' }}>Actions</th>
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
                                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '30px' }}>No tags registered.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LOG DASHBOARD TABLE (Purple Header) */}
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead style={theadStyle}>
                        <tr>
                            <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>SNo</th>
                            <th style={thStyle}>Timestamp</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Floor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log, index) => {
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
                                <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td style={tdStyle}>{formatTimestamp(log.timestamp)}</td>
                                    <td style={{ ...tdStyle, fontWeight: '500' }}>{log.name}</td>
                                    <td style={tdStyle}>{log.location}</td>
                                    <td style={tdStyle}>{log.floor}</td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', padding: '50px', color: '#999', fontSize: '16px' }}>
                                    No logs available for {building}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {Math.ceil(logs.length / itemsPerPage) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#f5f5f5' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <span style={{ fontSize: '14px', color: '#555' }}>
                        Page <strong>{currentPage}</strong> of <strong>{Math.ceil(logs.length / itemsPerPage)}</strong>
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(logs.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(logs.length / itemsPerPage)}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === Math.ceil(logs.length / itemsPerPage) ? '#f5f5f5' : 'white', cursor: currentPage === Math.ceil(logs.length / itemsPerPage) ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            )}


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
        borderBottom: '2px solid #a076f9',
        background: 'transparent',
        padding: '2px 5px',
        width: '100%',
        color: '#0f172a',
        fontWeight: '500',
        fontSize: '16px',
        outline: 'none'
    };

    const actionBtnStyle = {
        padding: '6px 10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        minWidth: '32px'
    };

    const editBtnStyle = {
        ...actionBtnStyle,
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        border: '1px solid #bbdefb'
    };

    const deleteBtnStyle = {
        ...actionBtnStyle,
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        border: '1px solid #ffcdd2'
    };

    return (
        <tr style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{index + 1}</td>

            <td style={tdStyle}>
                <span style={{ fontWeight: '600', color: '#555' }}>{data.tagId}</span>
            </td>

            <td style={tdStyle}>
                <span style={{ fontWeight: '600', color: '#555' }}>{data.building}</span>
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} autoFocus />
                ) : (
                    <span style={{ fontWeight: '500' }}>{data.location}</span>
                )}
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.floor} onChange={e => setEditData({ ...editData, floor: e.target.value })} />
                ) : (
                    <span style={{ fontWeight: '500' }}>{data.floor}</span>
                )}
            </td>

            <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} style={editBtnStyle} title="Save">✓</button>
                            <button onClick={() => setIsEditing(false)} style={deleteBtnStyle} title="Cancel">✕</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} style={editBtnStyle} title="Edit">
                                ✎
                            </button>
                            <button onClick={() => onDelete(data.id)} style={deleteBtnStyle} title="Delete">
                                🗑
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default GuardTouringManager;
