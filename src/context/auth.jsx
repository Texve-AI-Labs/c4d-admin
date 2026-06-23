import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const LEGACY_LOCAL_FILTER_KEYS = [
    'bookingListFilters',
    'bookingSearchId',
    'driverViewFilters',
    'autoViewFilters',
    'accountViewFilters',
    'docVerificationAllFilters',
    'docVerificationPendingFilters',
  ];
  
  useEffect(() => {
    LEGACY_LOCAL_FILTER_KEYS.forEach((key) => localStorage.removeItem(key));
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('bookingSearchId');
    sessionStorage.removeItem('bookingListFilters');
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key) continue;
      if (key.startsWith('bookingSearchId_') || key.startsWith('bookingFilters_')) {
        sessionStorage.removeItem(key);
      }
    }
    sessionStorage.removeItem('driverViewFilters');
    sessionStorage.removeItem('autoViewFilters');
    sessionStorage.removeItem('accountViewFilters');
    sessionStorage.removeItem('docVerificationAllFilters');
    sessionStorage.removeItem('docVerificationPendingFilters');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);