const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
const WS_BASE_URL = `${window.location.protocol === "https:" ? "wss" : "ws"
  }://${window.location.host}${import.meta.env.VITE_WS_PATH || "/ws"}`;

export const fetchLiftData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lifts`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching lift data:", error);
    console.log("Falling back to simulated data...");
    return simulatedLiftData();
  }
};

const simulatedLiftData = () => {
  const currentTime = Date.now();
  const variation = Math.floor(currentTime / 5000) % 3;
  return {
    "PRESTIGE POLYGON": [
      { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
    ],
    "PRESTIGE PALLADIUM": [
      { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
    ],
    "PRESTIGE METROPOLITAN": [
      { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
    ],
    "PRESTIGE COSMOPOLITAN": [
      { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
    ],
    "PRESTIGE CYBER TOWERS": [
      { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
      { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
    ],
  };
};

export const connectWebSocket = (onMessage) => {
  let ws;

  const connect = () => {
    ws = new WebSocket(WS_BASE_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "liftData") {
          onMessage(message.data, "full");
        } else if (message.type === "liftUpdate") {
          onMessage(message.data, "update");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed, retrying in 3s...");
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    };
  };

  connect();
  return () => ws && ws.close();
};

export const fetchPanelLogs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.building) queryParams.append("building", filters.building);
    if (filters.date) queryParams.append("date", filters.date);
    if (filters.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) queryParams.append("dateTo", filters.dateTo);
    if (filters.panelType) queryParams.append("panelType", filters.panelType);
    if (filters.time) queryParams.append("time", filters.time);

    const url = `${API_BASE_URL}/panel-logs${queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;
    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching panel logs:", error);
    throw error;
  }
};

export const fetchPanelLogById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/panel-logs/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching panel log:", error);
    throw error;
  }
};

export const checkDuplicatePanelLog = async (date, time, building) => {
  try {
    const logs = await fetchPanelLogs({
      dateFrom: date,
      dateTo: date,
      building: building,
    });
    const duplicate = logs.find(
      (log) =>
        log.time === time && log.date === date && log.building === building
    );
    return duplicate || null;
  } catch (error) {
    console.error("Error checking for duplicate:", error);
    return null;
  }
};

export const createPanelLog = async (logData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/panel-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error creating panel log:", error);
    throw error;
  }
};

export const updatePanelLog = async (id, logData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/panel-logs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error updating panel log:", error);
    throw error;
  }
};

export const deletePanelLog = async (id, panelType = null) => {
  try {
    const url = panelType
      ? `${API_BASE_URL}/panel-logs/${id}?panelType=${panelType}`
      : `${API_BASE_URL}/panel-logs/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error deleting panel log:", error);
    throw error;
  }
};

export const deleteAllPanelLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/panel-logs`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error deleting all panel logs:", error);
    throw error;
  }
};

export const fetchServiceLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/service-logs`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch service logs");
    return await response.json();
  } catch (error) {
    console.error("Error fetching service logs:", error);
    throw error;
  }
};

export const createServiceLog = async (logData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/service-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(logData),
    });
    if (!response.ok) throw new Error("Failed to create service log");
    return await response.json();
  } catch (error) {
    console.error("Error creating service log:", error);
    throw error;
  }
};

export const updateServiceLog = async (id, logData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/service-logs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(logData),
    });
    if (!response.ok) throw new Error("Failed to update service log");
    return await response.json();
  } catch (error) {
    console.error("Error updating service log:", error);
    throw error;
  }
};

export const deleteServiceLog = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/service-logs/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete service log");
    return await response.json();
  } catch (error) {
    console.error("Error deleting service log:", error);
    throw error;
  }
};

// User Management API
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create user");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update user");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete user");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
