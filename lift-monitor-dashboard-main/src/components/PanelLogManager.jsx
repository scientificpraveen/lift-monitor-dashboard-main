import React, { useState } from 'react';
import PanelLogList from './PanelLogList';
import PanelLogForm from './PanelLogForm';
import { createPanelLog, updatePanelLog, checkDuplicatePanelLog } from '../services/api';
import './PanelLogManager.css';

const PanelLogManager = () => {
  const [view, setView] = useState('list');
  const [editingLog, setEditingLog] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateNew = () => {
    setEditingLog(null);
    setView('create');
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setView('edit');
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingLog) {
        await updatePanelLog(editingLog.id, formData);
        showMessage('Panel log updated successfully!', 'success');
      } else {
        const duplicate = await checkDuplicatePanelLog(formData.date, formData.time, formData.building);
        if (duplicate) {
          const shouldUpdate = window.confirm(
            `An entry already exists for ${formData.building} on ${formData.date} at ${formData.time}.\n\nWould you like to update the existing entry instead?`
          );
          if (shouldUpdate) {
            await updatePanelLog(duplicate.id, formData);
            showMessage('Existing panel log updated successfully!', 'success');
          } else {
            showMessage('Entry creation cancelled.', 'info');
            return;
          }
        } else {
          await createPanelLog(formData);
          showMessage('Panel log created successfully!', 'success');
        }
      }
      setView('list');
      setEditingLog(null);
    } catch (error) {
      showMessage('Error saving panel log: ' + error.message, 'error');
      console.error('Error saving panel log:', error);
    }
  };

  const handleCancel = () => {
    setView('list');
    setEditingLog(null);
  };

  return (
    <div className="panel-log-manager">
      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      {view === 'list' && (
        <PanelLogList 
          onEdit={handleEdit} 
          onCreateNew={handleCreateNew}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <PanelLogForm
          initialData={editingLog}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default PanelLogManager;
