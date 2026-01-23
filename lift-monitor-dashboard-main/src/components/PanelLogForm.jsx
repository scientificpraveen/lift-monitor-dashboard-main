import React, { useState, useEffect } from "react";
import { buildings } from "../config/buildings";
import { getISTTimeSlot, formatTimeSlot, getISTDate } from "../utils/timeUtils";
import { useAuth } from "../context/AuthContext";
import "./PanelLogForm.css";

const PanelLogForm = ({ initialData = null, onSubmit, onCancel }) => {
  const { user, getAccessibleBuildings } = useAuth();
  const [formData, setFormData] = useState({
    building: buildings[0],
    date: getISTDate(),
    time: getISTTimeSlot(),
    panelType: "BOTH",

    htPanel: {
      icFromTneb: "EB",
      voltageFromWreb: { volt: "" },
      currentAmp: { r: "", y: "", b: "", pf: "", hz: "" },
      outgoingTr1: {
        currentAmp: { r: "", y: "", b: "" },
        windingTemp: "",
        oilTemp: "",
      },
      outgoingTr2: {
        currentAmp: { r: "", y: "", b: "" },
        windingTemp: "",
        oilTemp: "",
      },
      outgoingTr3: {
        currentAmp: { r: "", y: "", b: "" },
        windingTemp: "",
        oilTemp: "",
      },
    },

    ltPanel: {
      incomer1: {
        voltage: { ry: "", yb: "", br: "" },
        currentAmp: { r: "", y: "", b: "" },
        tap: "",
        kwh: "",
      },
      incomer2: {
        voltage: { ry: "", yb: "", br: "" },
        currentAmp: { r: "", y: "", b: "" },
        tap: "",
        kwh: "",
      },
      incomer3: {
        voltage: { ry: "", yb: "", br: "" },
        currentAmp: { r: "", y: "", b: "" },
        tap: "",
        kwh: "",
      },
    },
    shiftIncharge: {
      aShift: { name: "", signature: "" },
      bShift: { name: "", signature: "" },
      cShift: { name: "", signature: "" },
    },
    remarks: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const accessibleBuildings = getAccessibleBuildings(buildings);
      const defaultBuilding =
        accessibleBuildings.length > 0 ? accessibleBuildings[0] : buildings[0];
      setFormData((prev) => ({
        ...prev,
        building: defaultBuilding,
        time: getISTTimeSlot(),
      }));
    }
  }, [initialData, user]);

  const handleInputChange = (section, subsection, field, subfield, value) => {
    setFormData((prev) => {
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

  const validateForm = () => {
    // Validate HT Panel if present
    if (formData.panelType === "HT" || formData.panelType === "BOTH") {
      const ht = formData.htPanel;
      if (!ht.voltageFromWreb.volt) return "HT Panel Voltage is required";
      if (
        !ht.currentAmp.r ||
        !ht.currentAmp.y ||
        !ht.currentAmp.b ||
        !ht.currentAmp.pf ||
        !ht.currentAmp.hz
      ) {
        return "All HT Panel Current Amp fields are required";
      }
      for (let i = 1; i <= 3; i++) {
        const tr = `outgoingTr${i}`;
        if (
          !ht[tr].currentAmp.r ||
          !ht[tr].currentAmp.y ||
          !ht[tr].currentAmp.b
        ) {
          return `Outgoing Tr-${i} Current Amp (R, Y, B) are required`;
        }
        if (!ht[tr].windingTemp)
          return `Outgoing Tr-${i} Winding Temp is required`;
        if (!ht[tr].oilTemp) return `Outgoing Tr-${i} Oil Temp is required`;
      }
    }

    // Validate LT Panel if present
    if (formData.panelType === "LT" || formData.panelType === "BOTH") {
      const lt = formData.ltPanel;
      for (const incomer of ["incomer1", "incomer2", "incomer3"]) {
        const inc = lt[incomer];
        if (!inc.voltage.ry || !inc.voltage.yb || !inc.voltage.br) {
          return `${incomer} Voltage fields are required`;
        }
        if (!inc.currentAmp.r || !inc.currentAmp.y || !inc.currentAmp.b) {
          return `${incomer} Current Amp fields are required`;
        }
        if (!inc.tap) return `${incomer} Tap is required`;
        if (!inc.kwh) return `${incomer} KWH is required`;
      }
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    const dataToSubmit = {
      ...formData,
      time: initialData ? formData.time : getISTTimeSlot(),
      lastUpdatedBy: user?.name || user?.username || "Unknown",
    };
    onSubmit(dataToSubmit);
  };

  return (
    <div className="panel-log-form-container">
      <form onSubmit={handleSubmit} className="panel-log-form">
        <div className="form-header">
          <h2>{initialData ? "Edit Panel Log" : "Create Panel Log Entry"}</h2>
          <button
            type="button"
            className="form-close-btn"
            onClick={onCancel}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Building *</label>
              <select
                value={formData.building}
                onChange={(e) =>
                  handleInputChange(
                    "building",
                    null,
                    null,
                    null,
                    e.target.value,
                  )
                }
                required
              >
                {getAccessibleBuildings(buildings).map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                readOnly
                disabled
                title="Date is automatically set to today"
                style={{
                  background: "#e8f5e9",
                  cursor: "not-allowed",
                  fontWeight: "500",
                  color: "#2e7d32",
                }}
              />
            </div>

            <div className="form-group">
              <label>Panel Type *</label>
              <select
                value={formData.panelType}
                onChange={(e) =>
                  handleInputChange(
                    "panelType",
                    null,
                    null,
                    null,
                    e.target.value,
                  )
                }
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
                style={{
                  background: "#e8f5e9",
                  cursor: "not-allowed",
                  fontWeight: "500",
                  color: "#2e7d32",
                }}
              />
              <small
                style={{
                  color: "#666",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                📍 Auto-set based on current IST time | Updates in 2-hour
                intervals
              </small>
            </div>
          </div>
        </div>

        {(formData.panelType === "HT" || formData.panelType === "BOTH") && (
          <div className="form-section">
            <h3>HT Panel - Main Incomer Supply</h3>

            <div className="subsection">
              <h4>I/C From TNEB</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Source</label>
                  <select
                    value={formData.htPanel.icFromTneb}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "icFromTneb",
                        null,
                        null,
                        e.target.value,
                      )
                    }
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
                  <label>Voltage (kV) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.voltageFromWreb.volt}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "voltageFromWreb",
                        "volt",
                        null,
                        e.target.value,
                      )
                    }
                    placeholder="Enter voltage in kV"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="subsection">
              <h4>Current Amp</h4>
              <div className="form-row compact-row">
                <div className="form-group compact-group">
                  <label>R *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.currentAmp.r}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "currentAmp",
                        "r",
                        null,
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Y *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.currentAmp.y}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "currentAmp",
                        "y",
                        null,
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div className="form-group compact-group">
                  <label>B *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.currentAmp.b}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "currentAmp",
                        "b",
                        null,
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div className="form-group compact-group">
                  <label>PF *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.currentAmp.pf}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "currentAmp",
                        "pf",
                        null,
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Hz *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.htPanel.currentAmp.hz}
                    onChange={(e) =>
                      handleInputChange(
                        "htPanel",
                        "currentAmp",
                        "hz",
                        null,
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {["outgoingTr1", "outgoingTr2", "outgoingTr3"].map((tr, index) => (
              <div key={tr} className="subsection">
                <h4>Outgoing to Tr-{index + 1} (2000 Kva)</h4>
                <div className="transformer-readings">
                  <div className="reading-group">
                    <label>Current Amp</label>
                    <div className="form-row compact-row">
                      <div className="form-group compact-group">
                        <label>R *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.htPanel[tr].currentAmp.r}
                          onChange={(e) =>
                            handleInputChange(
                              "htPanel",
                              tr,
                              "currentAmp",
                              "r",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="form-group compact-group">
                        <label>Y *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.htPanel[tr].currentAmp.y}
                          onChange={(e) =>
                            handleInputChange(
                              "htPanel",
                              tr,
                              "currentAmp",
                              "y",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="form-group compact-group">
                        <label>B *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.htPanel[tr].currentAmp.b}
                          onChange={(e) =>
                            handleInputChange(
                              "htPanel",
                              tr,
                              "currentAmp",
                              "b",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="reading-group">
                    <label>Winding Temp</label>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Temperature (°C) *</label>
                        <input
                          type="text"
                          value={formData.htPanel[tr].windingTemp}
                          onChange={(e) =>
                            handleInputChange(
                              "htPanel",
                              tr,
                              "windingTemp",
                              null,
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="reading-group">
                    <label>Oil Temperature</label>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Temperature (°C) *</label>
                        <input
                          type="text"
                          value={formData.htPanel[tr].oilTemp}
                          onChange={(e) =>
                            handleInputChange(
                              "htPanel",
                              tr,
                              "oilTemp",
                              null,
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(formData.panelType === "LT" || formData.panelType === "BOTH") && (
          <div className="form-section">
            <h3>LT Panel - Incomers</h3>

            {["incomer1", "incomer2", "incomer3"].map((incomer, index) => (
              <div key={incomer} className="subsection">
                <h4>
                  Incomer-{index + 1} (From Tr-{index + 1})
                </h4>

                <div className="reading-group">
                  <label>Voltage</label>
                  <div className="form-row compact-row">
                    <div className="form-group compact-group">
                      <label>RY *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].voltage.ry}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "voltage",
                            "ry",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="form-group compact-group">
                      <label>YB *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].voltage.yb}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "voltage",
                            "yb",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="form-group compact-group">
                      <label>BR *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].voltage.br}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "voltage",
                            "br",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="reading-group">
                  <label>Current Amp</label>
                  <div className="form-row compact-row">
                    <div className="form-group compact-group">
                      <label>R *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].currentAmp.r}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "currentAmp",
                            "r",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="form-group compact-group">
                      <label>Y *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].currentAmp.y}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "currentAmp",
                            "y",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="form-group compact-group">
                      <label>B *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ltPanel[incomer].currentAmp.b}
                        onChange={(e) =>
                          handleInputChange(
                            "ltPanel",
                            incomer,
                            "currentAmp",
                            "b",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>TAP Position *</label>
                    <input
                      type="number"
                      value={formData.ltPanel[incomer].tap}
                      onChange={(e) =>
                        handleInputChange(
                          "ltPanel",
                          incomer,
                          "tap",
                          null,
                          e.target.value,
                        )
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>KWH *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ltPanel[incomer].kwh}
                      onChange={(e) =>
                        handleInputChange(
                          "ltPanel",
                          incomer,
                          "kwh",
                          null,
                          e.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {initialData ? "Update" : "Create"} Panel Log
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PanelLogForm;
