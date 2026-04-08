import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaSave, FaEdit, FaGripVertical } from "react-icons/fa";

export default function LiftPanelConfigModal({ isOpen, onClose, building, onConfigSaved }) {
    const [panels, setPanels] = useState([]);
    const [newPanel, setNewPanel] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [draggedIndex, setDraggedIndex] = useState(null);
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE || "http://localhost:3001/api"}/lifts/config`;

    useEffect(() => {
        if (isOpen && building) {
            fetchConfig();
            setNewPanel("");
            setEditingIndex(null);
            setEditValue("");
            setDraggedIndex(null);
        } else {
            setPanels([]);
            setNewPanel("");
            setEditingIndex(null);
            setEditValue("");
        }
    }, [isOpen, building]);

    const fetchConfig = async () => {
        const res = await fetch(`${API_BASE_URL}/${building}`, { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            setPanels(data.panels || []);
        }
    };

    const handleAdd = () => {
        if (!newPanel.trim() || panels.includes(newPanel.trim())) return;
        setPanels([...panels, newPanel.trim()]);
        setNewPanel("");
    };

    const handleDelete = (panelToDelete) => {
        setPanels(panels.filter(p => p !== panelToDelete));
    };

    const handleEditStart = (index, panel) => {
        setEditingIndex(index);
        setEditValue(panel);
    };

    const handleEditSave = (index) => {
        if (!editValue.trim() || (editValue.trim() !== panels[index] && panels.includes(editValue.trim()))) {
            setEditingIndex(null);
            return;
        }
        const updated = [...panels];
        updated[index] = editValue.trim();
        setPanels(updated);
        setEditingIndex(null);
    };

    const handleEditCancel = () => {
        setEditingIndex(null);
    };

    const handleDragStart = (index) => setDraggedIndex(index);

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const updated = [...panels];
        const draggedItem = updated[draggedIndex];
        updated.splice(draggedIndex, 1);
        updated.splice(index, 0, draggedItem);
        setDraggedIndex(index);
        setPanels(updated);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const handleSave = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/${building}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ panels })
            });
            if (res.ok) {
                if (onConfigSaved) onConfigSaved();
                onClose();
            } else {
                alert("Failed to save panel configuration. Server returned error.");
            }
        } catch (error) {
            console.error(error);
            alert("Network Error: Could not reach the API.");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>LIFT PANELS - {building}</h2>
                    <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#64748b' }}>
                        <FaTimes size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={newPanel}
                        onChange={(e) => setNewPanel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        placeholder="Add Panel ID (e.g. P1)"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button onClick={handleAdd} style={{ background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <FaPlus size={14} /> Add
                    </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                    {panels.map((panel, index) => (
                        <div
                            key={panel}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9',
                                padding: '6px 12px', borderRadius: '9999px', border: '1px solid #cbd5e1',
                                cursor: 'grab', opacity: draggedIndex === index ? 0.5 : 1
                            }}
                        >
                            <FaGripVertical size={12} color="#94a3b8" />
                            {editingIndex === index ? (
                                <>
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #94a3b8', width: '100px' }}
                                        autoFocus
                                    />
                                    <button onClick={() => handleEditSave(index)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaSave size={14} /></button>
                                    <button onClick={handleEditCancel} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaTimes size={14} /></button>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{panel}</span>
                                    <button onClick={() => handleEditStart(index, panel)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: '4px' }}>
                                        <FaEdit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(panel)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                        <FaTimes size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                    {panels.length === 0 && <span style={{ color: '#94a3b8' }}>No panels configured.</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <FaSave size={16} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
