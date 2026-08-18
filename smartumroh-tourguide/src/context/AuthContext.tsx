import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface Guide {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
}

interface AuthContextType {
  guide: Guide | null;
  loading: boolean;
  login: (token: string, guide: Guide) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  guide: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('guide_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setGuide(res.data.guide);
          localStorage.setItem('guide_name', res.data.guide.name);
        } catch (err) {
          localStorage.removeItem('guide_token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = (token: string, guideData: Guide) => {
    localStorage.setItem('guide_token', token);
    localStorage.setItem('guide_name', guideData.name);
    setGuide(guideData);
  };

  const logout = () => {
    localStorage.removeItem('guide_token');
    localStorage.removeItem('guide_name');
    localStorage.removeItem('room_token');
    setGuide(null);
  };

  return (
    <AuthContext.Provider value={{ guide, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
