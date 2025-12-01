import React, { useState, useEffect } from 'react';
import './PowerFailureModal.css';

const PowerFailureModal = ({ logId, initialFailures = [], onSave, onCancel }) => {
  const [failures, setFailures] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    fromHrs: '',
    toHrs: '',
    reason: '',
    isFullDay: false
  });

  useEffect(() => {
    if (initialFailures && Array.isArray(initialFailures)) {
      setFailures(initialFailures);
    } else if (initialFailures && typeof initialFailures === 'object') {
      setFailures([initialFailures]);
    } else {
      setFailures([]);
    }
  }, [initialFailures]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFullDayToggle = (checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        isFullDay: true,
        fromHrs: '00:00',
        toHrs: '23:59'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        isFullDay: false,
        fromHrs: '',
        toHrs: ''
      }));
    }
  };

  const handleAddOrUpdate = () => {
    if (!formData.fromHrs || !formData.toHrs) {
      alert('Please fill in both From and To times');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...failures];
      updated[editingIndex] = formData;
      setFailures(updated);
      setEditingIndex(null);
    } else {
      if (failures.length >= 5) {
        alert('Maximum 5 power failure entries allowed for the day');
        return;
      }
      setFailures([...failures, formData]);
    }

    setFormData({
      fromHrs: '',
      toHrs: '',
      reason: '',
      isFullDay: false
    });
  };

  const handleEdit = (index) => {
    setFormData(failures[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Delete this power failure entry?')) {
      setFailures(failures.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      alert('Please complete or cancel editing before saving');
      return;
    }
    onSave(failures);
  };

  const handleCancel = () => {
    setFormData({
      fromHrs: '',
      toHrs: '',
      reason: '',
      isFullDay: false
    });
    setEditingIndex(null);
    onCancel();
  };

  return (
    <div className="power-failure-modal-overlay" onClick={handleCancel}>
      <div className="power-failure-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Power Failure Details</h2>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <h3>{editingIndex !== null ? 'Edit' : 'Add'} Power Failure Entry</h3>
            
            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isFullDay}
                  onChange={(e) => handleFullDayToggle(e.target.checked)}
                />
                <span>Full Day Power Failure (00:00 - 23:59)</span>
              </label>
            </div>

            {!formData.isFullDay && (
              <div className="form-row">
                <div className="form-group">
                  <label>From Time *</label>
                  <input
                    type="time"
                    value={formData.fromHrs}
                    onChange={(e) => handleInputChange('fromHrs', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>To Time *</label>
                  <input
                    type="time"
                    value={formData.toHrs}
                    onChange={(e) => handleInputChange('toHrs', e.target.value)}
                  />
                </div>
              </div>
            )}

            {formData.isFullDay && (
              <div className="form-row">
                <div className="form-group">
                  <label>From Time</label>
                  <input
                    type="time"
                    value={formData.fromHrs}
                    disabled
                    style={{ backgroundColor: '#f0f0f0' }}
                  />
                </div>
                <div className="form-group">
                  <label>To Time</label>
                  <input
                    type="time"
                    value={formData.toHrs}
                    disabled
                    style={{ backgroundColor: '#f0f0f0' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group full-width">
              <label>Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows="2"
                placeholder="Optional reason for the power failure"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-add" onClick={handleAddOrUpdate}>
                {editingIndex !== null ? 'Update' : 'Add'} Entry
              </button>
              {editingIndex !== null && (
                <button className="btn btn-cancel" onClick={() => {
                  setEditingIndex(null);
                  setFormData({ fromHrs: '', toHrs: '', reason: '', isFullDay: false });
                }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="failures-list-section">
            <h3>Power Failure Entries ({failures.length}/5)</h3>
            <div className="entries-counter">
              <div className="counter-bar">
                <div className="counter-fill" style={{ width: `${(failures.length / 5) * 100}%` }}></div>
              </div>
              <span className="counter-text">{failures.length} of 5 entries</span>
            </div>
            {failures.length === 0 ? (
              <p className="no-entries">No power failure entries added yet</p>
            ) : (
              <div className="failures-list">
                {failures.map((failure, index) => (
                  <div key={index} className="failure-entry" style={{
                    backgroundColor: editingIndex === index ? '#fff3cd' : '#f8f9fa',
                    border: editingIndex === index ? '2px solid #ffc107' : '1px solid #ddd'
                  }}>
                    <div className="failure-info">
                      <p>
                        <strong>{failure.fromHrs} - {failure.toHrs}</strong>
                        {failure.isFullDay && <span className="full-day-badge">Full Day</span>}
                      </p>
                      {failure.reason && <p className="reason">{failure.reason}</p>}
                    </div>
                    <div className="failure-actions">
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(index)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(index)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PowerFailureModal;
