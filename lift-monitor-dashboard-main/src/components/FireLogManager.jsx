import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getISTDate, getISTTime } from '../utils/timeUtils';

const FireLogManager = ({ building }) => {
    const { user, isAdmin } = useAuth();
    const [mapping, setMapping] = useState([]);
    const [questions, setQuestions] = useState([]);

    // UI Toggles
    const [showTagDetails, setShowTagDetails] = useState(false);
    const [showQuestionDetails, setShowQuestionDetails] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        tagId: '',
        location: '',
        floor: '',
        type: 'Hose Reel Hose' // Default
    });

    // Question Form States
    const [questionType, setQuestionType] = useState('Hose Reel Hose');
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState({
        option1: '',
        option2: '',
        option3: ''
    });

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
    const apiBase = `${API_BASE}/fire`;

    // --- Data Fetching ---
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

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(`${apiBase}/questions?type=${questionType}&building=${building}`, { withCredentials: true });
            if (res.data.success) {
                setQuestions(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching questions", error);
        }
    };

    // --- Effects ---
    useEffect(() => {
        if (showTagDetails && isAdmin()) fetchMappings();
    }, [building, showTagDetails]);

    useEffect(() => {
        if (showQuestionDetails && isAdmin()) fetchQuestions();
    }, [showQuestionDetails, questionType, building]);

    // --- Handlers: Tags ---
    const handleAddTag = async (e) => {
        e.preventDefault();
        try {
            if (!formData.tagId || !formData.location || !formData.floor || !formData.type) {
                alert("All fields are required");
                return;
            }

            const payload = { ...formData, building };
            await axios.post(`${apiBase}/mapping`, payload, { withCredentials: true });
            alert("Tag added successfully!");
            setFormData({ tagId: '', location: '', floor: '', type: 'Hose Reel Hose' });
            fetchMappings();
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

    // --- Handlers: Questions ---
    const handleAddQuestion = async () => {
        if (!newQuestion.trim()) return;
        try {
            await axios.post(`${apiBase}/questions`,
                { type: questionType, question: newQuestion, building, ...newOptions },
                { withCredentials: true }
            );
            setNewQuestion('');
            setNewOptions({ option1: '', option2: '', option3: '' });
            fetchQuestions();
        } catch (error) {
            alert("Error adding question");
        }
    };

    const handleEditQuestion = async (id, updatedData) => {
        try {
            await axios.put(`${apiBase}/questions/${id}`, updatedData, { withCredentials: true });
            fetchQuestions();
        } catch (error) {
            alert("Error updating question");
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await axios.delete(`${apiBase}/questions/${id}`, { withCredentials: true });
            fetchQuestions();
        } catch (error) {
            alert("Error deleting question");
        }
    };


    // --- STYLES ---
    // --- STYLES (Matching GuardTouringManager) ---
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
        transition: 'border-color 0.3s',
        height: '45px',
        boxSizing: 'border-box'
    };

    const textAreaStyle = {
        ...inputStyle,
        height: 'auto',
        minHeight: '80px',
        resize: 'vertical',
        display: 'block'
    };

    const selectStyle = {
        ...inputStyle,
        appearance: 'auto',
        backgroundColor: 'white'
    };

    const saveButtonStyle = {
        ...primaryButtonStyle,
        padding: '10px 25px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    // Table Styling
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        background: 'white'
    };

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
        color: 'white'
    };

    const tdStyle = {
        padding: '12px 15px',
        borderBottom: '1px solid #f0f0f0',
        color: '#333',
        fontSize: '16px'
    };

    return (
        <div style={containerStyle}>
            {/* HEADER BAR */}
            <div style={headerStyle}>
                <div>
                    <h2 style={titleStyle}>FIRE LOG PANEL</h2>
                    <span style={{ fontSize: '14px', color: '#666', marginTop: '5px', display: 'block' }}>
                        Building Name: <strong>{building}</strong>
                    </span>
                </div>

                {isAdmin() && (
                    <div style={{ display: 'flex' }}>
                        <button
                            style={primaryButtonStyle}
                            onClick={() => { setShowTagDetails(!showTagDetails); setShowQuestionDetails(false); }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 5px 15px rgba(160, 118, 249, 0.3)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        >
                            {showTagDetails ? "Close Tag Details" : "Tag Details"}
                        </button>
                        <button
                            style={{ ...primaryButtonStyle, background: '#6c757d' }}
                            onClick={() => { setShowQuestionDetails(!showQuestionDetails); setShowTagDetails(false); }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 5px 15px rgba(108, 117, 125, 0.3)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        >
                            {showQuestionDetails ? "Close Question Details" : "Question Details"}
                        </button>
                    </div>
                )}
            </div>

            {/* TAG DETAILS SECTION (Admin Only) */}
            {isAdmin() && showTagDetails && (
                <>
                    {/* ADD TAG FORM */}
                    <div style={cardStyle}>
                        <h3 style={{ marginBottom: '25px', color: '#334155', fontSize: '20px' }}>Add New Tag</h3>
                        <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Tag ID</label>
                                <input type="text" placeholder="Scan Tag ID" value={formData.tagId} onChange={e => setFormData({ ...formData, tagId: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Building</label>
                                <input type="text" value={building} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Location</label>
                                <input type="text" placeholder="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Floor</label>
                                <input type="text" placeholder="Floor" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={selectStyle}>
                                    <option value="Hose Reel Hose">Hose Reel Hose</option>
                                    <option value="Fire Hydrant cabinet">Fire Hydrant cabinet</option>
                                    <option value="External Yard Hydrant">External Yard Hydrant</option>
                                </select>
                            </div>
                            <button type="submit" style={saveButtonStyle}>Save Tag</button>
                        </form>
                    </div>

                    {/* TAG LIST TABLE */}
                    <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                        <h3 style={{ marginBottom: '20px', color: '#334155', fontSize: '18px', fontWeight: 'bold' }}>Tag Details</h3>
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                        <th style={{ ...thStyle, width: '50px', color: '#334155' }}>#</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Tag ID</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Building</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Location</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Floor</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Type</th>
                                        <th style={{ ...thStyle, width: '100px', color: '#334155' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mapping.map((m, index) => (
                                        <FireMappingRow
                                            key={m.id}
                                            index={index}
                                            data={m}
                                            onUpdate={handleEditMapping}
                                            onDelete={handleDeleteMapping}
                                            tdStyle={tdStyle}
                                        />
                                    ))}
                                    {mapping.length === 0 && (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '18px' }}>No tags registered yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* QUESTION DETAILS SECTION (Admin Only) */}
            {isAdmin() && showQuestionDetails && (
                <>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #10b981', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#334155', fontSize: '20px' }}>
                                <span style={{ fontWeight: 'bold' }}>{questionType}</span>
                            </h3>
                            <select
                                value={questionType}
                                onChange={e => setQuestionType(e.target.value)}
                                style={{ ...selectStyle, maxWidth: '250px', margin: 0 }}
                            >
                                <option value="Hose Reel Hose">Hose Reel Hose</option>
                                <option value="Fire Hydrant cabinet">Fire Hydrant cabinet</option>
                                <option value="External Yard Hydrant">External Yard Hydrant</option>
                            </select>
                        </div>

                        {/* Add Question */}
                        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>New Question</label>

                            {/* Question Text */}
                            <div style={{ marginBottom: '15px' }}>
                                <textarea
                                    placeholder="Enter question here..."
                                    value={newQuestion}
                                    onChange={e => setNewQuestion(e.target.value)}
                                    style={{ ...textAreaStyle, width: '100%' }}
                                />
                            </div>

                            {/* Answer Options */}
                            <label style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Answer Options</label>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Option 1"
                                    value={newOptions.option1}
                                    onChange={e => setNewOptions({ ...newOptions, option1: e.target.value })}
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Option 2"
                                    value={newOptions.option2}
                                    onChange={e => setNewOptions({ ...newOptions, option2: e.target.value })}
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    placeholder="Option 3"
                                    value={newOptions.option3}
                                    onChange={e => setNewOptions({ ...newOptions, option3: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <button onClick={handleAddQuestion} style={{ ...saveButtonStyle, alignSelf: 'flex-start' }}>Save Question</button>
                        </div>

                        {/* Question List Table */}
                        <div style={{ ...cardStyle, borderLeft: '4px solid #f97316', marginTop: '20px', padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 20px 10px 20px', background: '#fff' }}>
                                <h3 style={{ margin: 0, color: '#334155', fontSize: '18px', fontWeight: 'bold' }}>Question List</h3>
                            </div>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ background: '#fff7ed' }}>
                                        <th style={{ ...thStyle, width: '40px', color: '#334155' }}>#</th>
                                        <th style={{ ...thStyle, width: '40%', color: '#334155' }}>Question</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Option 1</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Option 2</th>
                                        <th style={{ ...thStyle, color: '#334155' }}>Option 3</th>
                                        <th style={{ ...thStyle, width: '100px', color: '#334155' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q, index) => (
                                        <FireQuestionRow
                                            key={q.id}
                                            index={index}
                                            data={q}
                                            onUpdate={handleEditQuestion}
                                            onDelete={handleDeleteQuestion}
                                            tdStyle={tdStyle}
                                        />
                                    ))}
                                    {questions.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '18px' }}>No questions added yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* MAIN DASHBOARD CONTENT (Logs) */}
            {!showTagDetails && !showQuestionDetails && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px' }}>
                        <select
                            value={questionType} // Reusing the same state for simplicity, or we can create a separate one
                            onChange={e => setQuestionType(e.target.value)}
                            style={{ ...selectStyle, maxWidth: '250px', margin: 0 }}
                        >
                            <option value="Hose Reel Hose">Hose Reel Hose</option>
                            <option value="Fire Hydrant cabinet">Fire Hydrant cabinet</option>
                            <option value="External Yard Hydrant">External Yard Hydrant</option>
                        </select>
                    </div>

                    <FireLogViewer
                        building={building}
                        type={questionType}
                        apiBase={apiBase}
                        isAdmin={isAdmin()} // Pass admin status
                    />
                </div>
            )}
        </div>
    );
};

// Helper component for editable TAG row
const FireMappingRow = ({ index, data, onUpdate, onDelete, tdStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...data });

    const handleSave = () => {
        onUpdate(data.id, {
            location: editData.location,
            floor: editData.floor,
            type: editData.type
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
        fontSize: '16px'
    };

    const selectInline = {
        ...inputInline,
        borderBottom: '2px solid #a076f9',
    }

    return (
        <tr style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ ...tdStyle, fontWeight: 'bold', width: '50px' }}>{index + 1}</td>
            <td style={tdStyle}><span style={{ fontWeight: '600', color: '#64748b' }}>{data.tagId}</span></td>
            <td style={tdStyle}><span style={{ fontWeight: '600', color: '#64748b' }}>{data.building}</span></td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
                ) : <span style={{ fontWeight: '600' }}>{data.location}</span>}
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <input style={inputInline} value={editData.floor} onChange={e => setEditData({ ...editData, floor: e.target.value })} />
                ) : <span style={{ fontWeight: '600' }}>{data.floor}</span>}
            </td>

            <td style={tdStyle}>
                {isEditing ? (
                    <select style={selectInline} value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })}>
                        <option value="Hose Reel Hose">Hose Reel Hose</option>
                        <option value="Fire Hydrant cabinet">Fire Hydrant cabinet</option>
                        <option value="External Yard Hydrant">External Yard Hydrant</option>
                    </select>
                ) : <span style={{ fontWeight: '600', color: '#ea580c' }}>{data.type}</span>}
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
                            <button onClick={() => setIsEditing(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Edit">✏️</button>
                            <button onClick={() => onDelete(data.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

// Helper component for editable QUESTION row (Table Format)
const FireQuestionRow = ({ index, data, onUpdate, onDelete, tdStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        question: data.question,
        option1: data.option1 || '',
        option2: data.option2 || '',
        option3: data.option3 || ''
    });

    const handleSave = () => {
        onUpdate(data.id, editData);
        setIsEditing(false);
    };

    const inputInline = {
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '4px 8px',
        width: '100%',
        color: '#0f172a',
        fontWeight: 'normal',
        fontSize: '14px'
    };

    const textAreaInline = {
        ...inputInline,
        minHeight: '50px',
        resize: 'vertical'
    };

    return (
        <tr style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ ...tdStyle, fontWeight: 'bold', verticalAlign: 'top' }}>{index + 1}</td>

            <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                {isEditing ? (
                    <textarea
                        value={editData.question}
                        onChange={e => setEditData({ ...editData, question: e.target.value })}
                        style={textAreaInline}
                    />
                ) : (
                    <span style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{data.question}</span>
                )}
            </td>

            <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                {isEditing ? (
                    <input
                        value={editData.option1}
                        onChange={e => setEditData({ ...editData, option1: e.target.value })}
                        style={inputInline}
                    />
                ) : (
                    <span style={{ color: '#64748b' }}>{data.option1}</span>
                )}
            </td>

            <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                {isEditing ? (
                    <input
                        value={editData.option2}
                        onChange={e => setEditData({ ...editData, option2: e.target.value })}
                        style={inputInline}
                    />
                ) : (
                    <span style={{ color: '#64748b' }}>{data.option2}</span>
                )}
            </td>

            <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                {isEditing ? (
                    <input
                        value={editData.option3}
                        onChange={e => setEditData({ ...editData, option3: e.target.value })}
                        style={inputInline}
                    />
                ) : (
                    <span style={{ color: '#64748b' }}>{data.option3}</span>
                )}
            </td>

            <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✓</button>
                            <button onClick={() => setIsEditing(false)} style={{ color: 'gray', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }} title="Edit">✏️</button>
                            <button onClick={() => onDelete(data.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }} title="Delete">🗑️</button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

// --- LOG VIEWER COMPONENT (With Admin Edit) ---
const FireLogViewer = ({ building, type, apiBase, isAdmin }) => {
    const [logs, setLogs] = useState([]);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        fetchLogs();
        fetchQuestions();
    }, [building, type]);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${apiBase}/logs?building=${building}&type=${type}`, { withCredentials: true });
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching logs", error);
        }
    };

    const fetchQuestions = async () => {
        try {
            // Fetch questions to know the columns AND options for editing
            const res = await axios.get(`${apiBase}/questions?building=${building}&type=${type}`, { withCredentials: true });
            if (res.data.success) {
                setQuestions(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching questions for columns", error);
        }
    };

    const handleUpdateLog = async (logId, answers, remarks) => {
        try {
            await axios.put(`${apiBase}/logs/${logId}`, { answers, remarks }, { withCredentials: true });
            fetchLogs(); // Refresh
        } catch (error) {
            alert("Error updating log");
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        try {
            await axios.delete(`${apiBase}/logs/${logId}`, { withCredentials: true });
            fetchLogs(); // Refresh
        } catch (error) {
            alert("Error deleting log");
        }
    };

    // Styles
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        background: 'white'
    };

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
        color: 'white'
    };

    const tdStyle = {
        padding: '12px 15px',
        borderBottom: '1px solid #f0f0f0',
        color: '#333',
        fontSize: '16px'
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' }}>
            <table style={tableStyle}>
                <thead style={theadStyle}>
                    <tr>
                        <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>S.NO</th>
                        <th style={thStyle}>Timestamp</th>
                        <th style={thStyle}>Location</th>
                        <th style={thStyle}>Floor</th>

                        {/* Dynamic Question Headers */}
                        {questions.map((q, i) => (
                            <th key={q.id} style={thStyle}>
                                {q.question}
                            </th>
                        ))}

                        <th style={thStyle}>Remarks</th>
                        <th style={thStyle}>Update By</th>
                        {isAdmin && <th style={{ ...thStyle, width: '100px' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log, index) => (
                        <EditableFireLog
                            key={log.id}
                            log={log}
                            index={index}
                            questions={questions}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdateLog}
                            onDelete={handleDeleteLog}
                            tdStyle={tdStyle}
                        />
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={6 + questions.length + (isAdmin ? 1 : 0)} style={{ padding: '50px', textAlign: 'center', color: '#999', fontSize: '16px' }}>
                                No logs found for this selection.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// Component for Editable Log Row
const EditableFireLog = ({ log, index, questions, isAdmin, onUpdate, onDelete, tdStyle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [answers, setAnswers] = useState(log.answers || {});
    const [remarks, setRemarks] = useState(log.remarks || '');

    const date = new Date(log.timestamp).toLocaleString();

    const handleSave = () => {
        onUpdate(log.id, answers, remarks);
        setIsEditing(false);
    };

    // Reset on cancel or new props
    useEffect(() => {
        if (!isEditing) {
            setAnswers(log.answers || {});
            setRemarks(log.remarks || '');
        }
    }, [log, isEditing]);

    const inputInline = {
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        padding: '4px 8px',
        width: '100%',
        color: '#0f172a',
        fontSize: '14px'
    };

    return (
        <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
            <td style={{ ...tdStyle, textAlign: 'center' }}>{index + 1}</td>
            <td style={tdStyle}>{date}</td>
            <td style={tdStyle}>{log.location}</td>
            <td style={tdStyle}>{log.floor}</td>

            {/* Answers for each column */}
            {questions.map(q => {
                const currentAnswer = answers[q.question] || "-";

                // Get options array
                const options = [q.option1, q.option2, q.option3].filter(Boolean); // Filter out null/empty

                return (
                    <td key={q.id} style={tdStyle}>
                        {isEditing ? (
                            <select
                                value={currentAnswer === "-" ? "" : currentAnswer}
                                onChange={(e) => setAnswers({ ...answers, [q.question]: e.target.value })}
                                style={inputInline}
                            >
                                <option value="" disabled>Select</option>
                                {options.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            currentAnswer
                        )}
                    </td>
                );
            })}

            <td style={tdStyle}>
                {isEditing ? (
                    <input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        style={inputInline}
                    />
                ) : (
                    log.remarks
                )}
            </td>
            <td style={tdStyle}>{log.userName}</td>

            {/* Actions for Admin */}
            {isAdmin && (
                <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Save">✓</button>
                                <button onClick={() => setIsEditing(false)} style={{ color: 'gray', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Cancel">✕</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Edit">✏️</button>
                                <button onClick={() => onDelete(log.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                            </>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};

export default FireLogManager;
