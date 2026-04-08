import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

const ShiftTimingModal = ({ isOpen, onClose, building, initialConfig, onSave }) => {
    const [formData, setFormData] = useState({
        shiftAStart: '00:00', shiftAEnd: '07:59',
        shiftBStart: '08:00', shiftBEnd: '15:59',
        shiftCStart: '16:00', shiftCEnd: '23:59'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialConfig) {
            setFormData({
                shiftAStart: initialConfig.shiftAStart, shiftAEnd: initialConfig.shiftAEnd,
                shiftBStart: initialConfig.shiftBStart, shiftBEnd: initialConfig.shiftBEnd,
                shiftCStart: initialConfig.shiftCStart, shiftCEnd: initialConfig.shiftCEnd
            });
        }
    }, [initialConfig, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateShifts = () => {
        // 1440 minutes in a perfect 24-hour cycle
        const coverage = new Array(1440).fill(0);

        const timeToMinutes = (t) => {
            if (!t) return 0;
            const [h, m] = t.split(':');
            return parseInt(h) * 60 + parseInt(m);
        };

        const processShift = (start, end) => {
            let s = timeToMinutes(start);
            let e = timeToMinutes(end);
            // Handle cross-midnight shifts physically (e.g., 22:00 -> 06:00)
            if (e < s) {
                for (let i = s; i <= 1439; i++) coverage[i]++;
                for (let i = 0; i <= e; i++) coverage[i]++;
            } else {
                for (let i = s; i <= e; i++) coverage[i]++;
            }
        };

        processShift(formData.shiftAStart, formData.shiftAEnd);
        processShift(formData.shiftBStart, formData.shiftBEnd);
        processShift(formData.shiftCStart, formData.shiftCEnd);

        const overlaps = coverage.some(c => c > 1);
        const gaps = coverage.some(c => c === 0);

        if (overlaps) return "Error: Shifts overlap. Please use unique timings.";
        if (gaps) return "Error: There are 24-hr gaps. Please cover missing times.";
        return null;
    };

    const handleSubmit = async () => {
        const vError = validateShifts();
        if (vError) {
            setError(vError);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/shifts/config`, { ...formData, building }, { withCredentials: true });
            onSave(res.data.config);
            onClose();
        } catch (err) {
            setError("Failed to push configuration to database: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ marginTop: '0', color: '#1e293b', fontSize: '1.25rem' }}>Update Shifts - {building}</h3>

                {error && <div className="error-message" style={{ margin: '15px 0', padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.875rem', fontWeight: '500' }}>{error}</div>}

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>Shift A</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Start Time</label>
                            <input type="time" name="shiftAStart" value={formData.shiftAStart} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>End Time</label>
                            <input type="time" name="shiftAEnd" value={formData.shiftAEnd} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>Shift B</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Start Time</label>
                            <input type="time" name="shiftBStart" value={formData.shiftBStart} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>End Time</label>
                            <input type="time" name="shiftBEnd" value={formData.shiftBEnd} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>Shift C</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Start Time</label>
                            <input type="time" name="shiftCStart" value={formData.shiftCStart} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>End Time</label>
                            <input type="time" name="shiftCEnd" value={formData.shiftCEnd} onChange={handleChange} required className="form-control" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading} style={{ borderRadius: '6px', padding: '8px 16px' }}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ borderRadius: '6px', padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none' }}>{loading ? 'Saving...' : 'Submit Update'}</button>
                </div>
            </div>
        </div>
    );
};
export default ShiftTimingModal;
