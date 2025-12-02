import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_BASE}/auth/signup`,
        { email, password, name },
        { withCredentials: true }
      );
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Signup failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_BASE}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  // Helper functions for privilege checking
  const hasPrivilege = (privilege) => {
    if (!user) return false;
    return user.privileges?.includes(privilege) || false;
  };

  const canView = () => hasPrivilege("view");
  const canCreate = () => hasPrivilege("create");
  const canEdit = () => hasPrivilege("edit");
  const canDelete = () => hasPrivilege("delete");
  const isAdmin = () => user?.role === "admin";

  // Get user's accessible buildings
  const getAccessibleBuildings = (allBuildings) => {
    if (!user) return [];
    // Admin or users with no assigned buildings can see all
    if (
      user.role === "admin" ||
      !user.assignedBuildings ||
      user.assignedBuildings.length === 0
    ) {
      return allBuildings;
    }
    return allBuildings.filter((b) => user.assignedBuildings.includes(b));
  };

  // Check if user has access to a specific building
  const hasAccessToBuilding = (building) => {
    if (!user) return false;
    if (
      user.role === "admin" ||
      !user.assignedBuildings ||
      user.assignedBuildings.length === 0
    ) {
      return true;
    }
    return user.assignedBuildings.includes(building);
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
    // Privilege helpers
    hasPrivilege,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    getAccessibleBuildings,
    hasAccessToBuilding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
