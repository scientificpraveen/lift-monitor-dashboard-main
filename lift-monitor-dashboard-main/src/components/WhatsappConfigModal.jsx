import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";

export default function WhatsappConfigModal({ isOpen, onClose, building }) {
    const [numbers, setNumbers] = useState([]);
    const [newNumber, setNewNumber] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE || "http://localhost:3001/api"}/whatsapp-numbers`;

    useEffect(() => {
        if (isOpen && building) {
            fetchNumbers();
            setNewNumber("");
            setEditingId(null);
            setEditValue("");
        } else {
            setNumbers([]);
            setNewNumber("");
            setEditingId(null);
            setEditValue("");
        }
    }, [isOpen, building]);

    const fetchNumbers = async () => {
        const res = await fetch(`${API_BASE_URL}/${building}`, { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            setNumbers(data.numbers || []);
        }
    };

    const handleAdd = () => {
        const trimmed = newNumber.trim();
        if (!trimmed) return;
        if (!/^\d+$/.test(trimmed)) {
            alert("Phone number can only contain digits.");
            return;
        }
        if (numbers.includes(trimmed)) {
            alert("This number is already configured for this building.");
            return;
        }
        setNumbers([...numbers, trimmed]);
        setNewNumber("");
    };

    const handleDelete = (numToDelete) => {
        setNumbers(numbers.filter(n => n !== numToDelete));
    };

    const handleEditStart = (index, currentNum) => {
        setEditingId(index);
        setEditValue(currentNum);
    };

    const handleEditSave = (index) => {
        const trimmed = editValue.trim();
        if (!trimmed) { setEditingId(null); return; }
        if (!/^\d+$/.test(trimmed)) {
            alert("Phone number can only contain digits.");
            return;
        }
        if (trimmed !== numbers[index] && numbers.includes(trimmed)) {
            alert("This number is already configured for this building.");
            return;
        }
        const updated = [...numbers];
        updated[index] = trimmed;
        setNumbers(updated);
        setEditingId(null);
    };

    const handleEditCancel = () => setEditingId(null);

    const handleSaveConfig = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/${building}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ numbers })
            });
            if (res.ok) {
                onClose();
            } else {
                alert("Failed to save WhatsApp configuration.");
            }
        } catch (error) {
            alert("Network Error: Could not save WhatsApp configuration.");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>WHATSAPP NUMBER FOR ALERT - {building}</h2>
                    <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#64748b' }}>
                        <FaTimes size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        placeholder="Enter whatsapp number"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button onClick={handleAdd} style={{ background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <FaPlus size={14} /> Add
                    </button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '8px', color: '#475569', fontSize: '14px' }}>Mobile Number</th>
                                <th style={{ textAlign: 'right', padding: '8px', color: '#475569', fontSize: '14px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {numbers.map((num, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '12px 8px', color: '#1e293b' }}>
                                        {editingId === index ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #94a3b8', width: '100%' }}
                                                autoFocus
                                            />
                                        ) : (
                                            num
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        {editingId === index ? (
                                            <>
                                                <button onClick={() => handleEditSave(index)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaSave size={18} /></button>
                                                <button onClick={handleEditCancel} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaTimes size={18} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditStart(index, num)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaEdit size={18} /></button>
                                                <button onClick={() => handleDelete(num)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><FaTrash size={18} /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {numbers.length === 0 && (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No number configured</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button onClick={handleSaveConfig} style={{ background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <FaSave size={16} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
