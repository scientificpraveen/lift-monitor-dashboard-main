import React, { useState, useEffect } from 'react';
import { buildings } from '../config/buildings';
import { getISTTimeSlot, formatTimeSlot } from '../utils/timeUtils';
import './PanelLogForm.css';

const PanelLogForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    building: buildings[0],
    date: new Date().toISOString().split('T')[0],
    time: getISTTimeSlot(),
    panelType: 'BOTH',
    
    htPanel: {
      icFromTneb: 'EB',
      voltageFromWreb: { volt: '' },
      currentAmp: { r: '', y: '', b: '', pf: '', hz: '' },
      outgoingTr1: {
        currentAmp: { r: '', y: '', b: '' },
        windingTemp: { r: '', y: '', b: '' }
      },
      outgoingTr2: {
        currentAmp: { r: '', y: '', b: '' },
        windingTemp: { r: '', y: '', b: '' }
      },
      outgoingTr3: {
        currentAmp: { r: '', y: '', b: '' },
        windingTemp: { r: '', y: '', b: '' }
      }
    },
    
    ltPanel: {
      incomer1: {
        voltage: { ry: '', yb: '', br: '' },
        currentAmp: { r: '', y: '', b: '' },
        tap: '',
        kwh: ''
      },
      incomer2: {
        voltage: { ry: '', yb: '', br: '' },
        currentAmp: { r: '', y: '', b: '' },
        tap: '',
        kwh: ''
      },
      incomer3: {
        voltage: { ry: '', yb: '', br: '' },
        currentAmp: { r: '', y: '', b: '' },
        tap: '',
        kwh: ''
      }
    },
    
    shiftIncharge: {
      aShift: { name: '', sign: '' },
      bShift: { name: '', sign: '' },
      cShift: { name: '', sign: '' }
    },
    
    remarks: '',
    engineerSignature: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(prev => ({
        ...prev,
        time: getISTTimeSlot()
      }));
    }
  }, [initialData]);

  const handleInputChange = (section, subsection, field, subfield, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (subfield) {
        newData[section][subsection][field][subfield] = value;
      } else if (field) {
        newData[section][subsection][field] = value;
      } else if (subsection) {
        newData[section][subsection] = value;
      } else {
        newData[section] = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      time: initialData ? formData.time : getISTTimeSlot()
    };
    onSubmit(dataToSubmit);
  };

  return (
    <div className="panel-log-form-container">
      <form onSubmit={handleSubmit} className="panel-log-form">
        <div className="form-header">
          <h2>{initialData ? 'Edit Panel Log' : 'Create Panel Log Entry'}</h2>
          <button type="button" className="form-close-btn" onClick={onCancel} title="Close">×</button>
        </div>
        
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Building *</label>
              <select
                value={formData.building}
                onChange={(e) => handleInputChange('building', null, null, null, e.target.value)}
                required
              >
                {buildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', null, null, null, e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Panel Type *</label>
              <select
                value={formData.panelType}
                onChange={(e) => handleInputChange('panelType', null, null, null, e.target.value)}
                required
              >
                <option value="HT">HT Panel Only</option>
                <option value="LT">LT Panel Only</option>
                <option value="BOTH">Both Panels</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Time Slot (Auto-calculated) ⏰</label>
              <input
                type="text"
                value={`${formData.time} (${formatTimeSlot(formData.time)})`}
                readOnly
                disabled
                title="Time is automatically calculated based on IST timezone in 2-hour intervals"
                style={{ background: '#e8f5e9', cursor: 'not-allowed', fontWeight: '500', color: '#2e7d32' }}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                📍 Auto-set based on current IST time | Updates in 2-hour intervals
              </small>
            </div>
          </div>
        </div>

        {(formData.panelType === 'HT' || formData.panelType === 'BOTH') && (
        <div className="form-section">
          <h3>HT Panel - Main Incomer Supply</h3>
          
          <div className="subsection">
            <h4>I/C From TNEB</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Source</label>
                <select
                  value={formData.htPanel.icFromTneb}
                  onChange={(e) => handleInputChange('htPanel', 'icFromTneb', null, null, e.target.value)}
                >
                  <option value="EB">EB</option>
                  <option value="DG">DG</option>
                  <option value="SOLAR">SOLAR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Volt (kv)</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Voltage (kV)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.voltageFromWreb.volt}
                  onChange={(e) => handleInputChange('htPanel', 'voltageFromWreb', 'volt', null, e.target.value)}
                  placeholder="Enter voltage in kV"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Current Amp</h4>
            <div className="form-row">
              <div className="form-group">
                <label>R</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.currentAmp.r}
                  onChange={(e) => handleInputChange('htPanel', 'currentAmp', 'r', null, e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Y</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.currentAmp.y}
                  onChange={(e) => handleInputChange('htPanel', 'currentAmp', 'y', null, e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>B</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.currentAmp.b}
                  onChange={(e) => handleInputChange('htPanel', 'currentAmp', 'b', null, e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>PF</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.currentAmp.pf}
                  onChange={(e) => handleInputChange('htPanel', 'currentAmp', 'pf', null, e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Hz</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.htPanel.currentAmp.hz}
                  onChange={(e) => handleInputChange('htPanel', 'currentAmp', 'hz', null, e.target.value)}
                />
              </div>
            </div>
          </div>

          {['outgoingTr1', 'outgoingTr2', 'outgoingTr3'].map((tr, index) => (
            <div key={tr} className="subsection">
              <h4>Outgoing to Tr-{index + 1} (2000 Kva)</h4>
              <div className="transformer-readings">
                <div className="reading-group">
                  <label>Current Amp</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>R</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].currentAmp.r}
                        onChange={(e) => handleInputChange('htPanel', tr, 'currentAmp', 'r', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Y</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].currentAmp.y}
                        onChange={(e) => handleInputChange('htPanel', tr, 'currentAmp', 'y', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>B</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].currentAmp.b}
                        onChange={(e) => handleInputChange('htPanel', tr, 'currentAmp', 'b', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="reading-group">
                  <label>Winding Temp</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>R</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].windingTemp.r}
                        onChange={(e) => handleInputChange('htPanel', tr, 'windingTemp', 'r', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Y</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].windingTemp.y}
                        onChange={(e) => handleInputChange('htPanel', tr, 'windingTemp', 'y', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>B</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.htPanel[tr].windingTemp.b}
                        onChange={(e) => handleInputChange('htPanel', tr, 'windingTemp', 'b', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {(formData.panelType === 'LT' || formData.panelType === 'BOTH') && (
        <div className="form-section">
          <h3>LT Panel - Incomers</h3>
          
          {['incomer1', 'incomer2', 'incomer3'].map((incomer, index) => (
            <div key={incomer} className="subsection">
              <h4>Incomer-{index + 1} (From Tr-{index + 1})</h4>
              
              <div className="reading-group">
                <label>Voltage</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>RY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].voltage.ry}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'voltage', 'ry', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>YB</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].voltage.yb}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'voltage', 'yb', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>BR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].voltage.br}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'voltage', 'br', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="reading-group">
                <label>Current Amp</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>R</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].currentAmp.r}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'currentAmp', 'r', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Y</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].currentAmp.y}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'currentAmp', 'y', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>B</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].currentAmp.b}
                      onChange={(e) => handleInputChange('ltPanel', incomer, 'currentAmp', 'b', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>TAP Position</label>
                  <input
                    type="number"
                    value={formData.ltPanel[incomer].tap}
                    onChange={(e) => handleInputChange('ltPanel', incomer, 'tap', null, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>KWH</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ltPanel[incomer].kwh}
                    onChange={(e) => handleInputChange('ltPanel', incomer, 'kwh', null, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className="form-section">
          <h3>Shift Incharge</h3>
          
          {['aShift', 'bShift', 'cShift'].map((shift, index) => (
            <div key={shift} className="form-row">
              <div className="form-group">
                <label>{String.fromCharCode(65 + index)} Shift Name</label>
                <input
                  type="text"
                  value={formData.shiftIncharge[shift].name}
                  onChange={(e) => handleInputChange('shiftIncharge', shift, 'name', null, e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{String.fromCharCode(65 + index)} Shift Signature</label>
                <input
                  type="text"
                  value={formData.shiftIncharge[shift].sign}
                  onChange={(e) => handleInputChange('shiftIncharge', shift, 'sign', null, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group full-width">
            <label>Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', null, null, null, e.target.value)}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Engineer Signature</label>
            <input
              type="text"
              value={formData.engineerSignature}
              onChange={(e) => handleInputChange('engineerSignature', null, null, null, e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {initialData ? 'Update' : 'Create'} Panel Log
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PanelLogForm;
