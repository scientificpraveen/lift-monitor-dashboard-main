import React, { useState } from "react";
import PanelLogList from "./PanelLogList";
import PanelLogForm from "./PanelLogForm";
import {
  createPanelLog,
  updatePanelLog,
  checkDuplicatePanelLog,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./PanelLogManager.css";

const PanelLogManager = () => {
  const { canCreate, canEdit } = useAuth();
  const [view, setView] = useState("list");
  const [editingLog, setEditingLog] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateNew = () => {
    if (!canCreate()) return;
    setEditingLog(null);
    setView("create");
  };

  const handleEdit = (log) => {
    if (!canEdit()) return;
    setEditingLog(log);
    setView("edit");
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingLog) {
        await updatePanelLog(editingLog.id, formData);
        showMessage("Panel log updated successfully!", "success");
      } else {
        const duplicate = await checkDuplicatePanelLog(
          formData.date,
          formData.time,
          formData.building
        );
        if (duplicate) {
          // Check what data exists and what's being added
          const existingHasHT =
            duplicate.htPanel &&
            Object.values(duplicate.htPanel).some(
              (v) =>
                v && (typeof v !== "object" || Object.values(v).some((x) => x))
            );
          const existingHasLT =
            duplicate.ltPanel &&
            Object.values(duplicate.ltPanel).some(
              (v) =>
                v && (typeof v !== "object" || Object.values(v).some((x) => x))
            );

          let confirmMessage = `An entry already exists for ${formData.building} on ${formData.date} at ${formData.time}.`;

          if (existingHasHT && !existingHasLT) {
            confirmMessage += `\n\nThe existing entry has HT Panel data. Your new data will be merged with it.`;
          } else if (existingHasLT && !existingHasHT) {
            confirmMessage += `\n\nThe existing entry has LT Panel data. Your new data will be merged with it.`;
          } else if (existingHasHT && existingHasLT) {
            confirmMessage += `\n\nThe existing entry has both HT and LT Panel data. Your new data will be merged/updated.`;
          } else {
            confirmMessage += `\n\nWould you like to update the existing entry?`;
          }

          const shouldUpdate = window.confirm(
            confirmMessage + "\n\nClick OK to merge, Cancel to abort."
          );

          if (shouldUpdate) {
            await updatePanelLog(duplicate.id, formData);
            showMessage("Panel log merged successfully!", "success");
          } else {
            showMessage("Entry creation cancelled.", "info");
            return;
          }
        } else {
          await createPanelLog(formData);
          showMessage("Panel log created successfully!", "success");
        }
      }
      setView("list");
      setEditingLog(null);
    } catch (error) {
      showMessage("Error saving panel log: " + error.message, "error");
      console.error("Error saving panel log:", error);
    }
  };

  const handleCancel = () => {
    setView("list");
    setEditingLog(null);
  };

  return (
    <div className="panel-log-manager">
      {message && (
        <div className={`message-banner ${message.type}`}>{message.text}</div>
      )}

      {view === "list" && (
        <PanelLogList
          onEdit={canEdit() ? handleEdit : null}
          onCreateNew={canCreate() ? handleCreateNew : null}
        />
      )}

      {(view === "create" || view === "edit") && (
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
