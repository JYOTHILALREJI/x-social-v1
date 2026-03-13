"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  
  // This is where we will check cookies/sessions later
  useEffect(() => {
    // Logic to fetch user from cookie session
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};