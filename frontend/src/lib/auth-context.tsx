import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginAPI, logoutAPI } from "./api";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: "mospi_auditor" | "state_nodal_authority" | "district_authority" | "mp_representative" | string;
  role_title?: string;
  assigned_scope?: string;
  designation?: string;
  jurisdiction?: string;
  department?: string;
  avatar_initials?: string;
}

export interface DemoAccount {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  role_title: string;
  assigned_scope: string;
  designation: string;
  jurisdiction: string;
  department: string;
  avatar_initials: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "mospi_auditor",
    email: "auditor@mospi.gov.in",
    password: "auditor123",
    name: "Dr. Priya Deshmukh",
    role: "mospi_auditor",
    role_title: "MoSPI Auditor",
    assigned_scope: "All India",
    designation: "Central Compliance & Vigilance Auditor, MoSPI",
    jurisdiction: "All India (All States & UTs)",
    department: "Ministry of Statistics & Programme Implementation",
    avatar_initials: "MA",
  },
  {
    username: "state_nodal",
    email: "state.nodal@gov.in",
    password: "state123",
    name: "K. Vijayalakshmi, IAS",
    role: "state_nodal_authority",
    role_title: "State Nodal Authority",
    assigned_scope: "Assigned State",
    designation: "State Nodal Officer & Secretary (Planning)",
    jurisdiction: "Assigned State: Maharashtra",
    department: "State Planning & Development Department",
    avatar_initials: "SN",
  },
  {
    username: "district_authority",
    email: "district.authority@mplads.gov.in",
    password: "district123",
    name: "S. Ranganathan, IAS",
    role: "district_authority",
    role_title: "District Authority",
    assigned_scope: "Assigned District",
    designation: "District Collector & District Authority",
    jurisdiction: "Assigned District: South Delhi",
    department: "District Collectorate & Planning Cell",
    avatar_initials: "DA",
  },
  {
    username: "mp_representative",
    email: "mp.rep@sansad.nic.in",
    password: "mp123",
    name: "Rajesh Sharma, MP Delegate",
    role: "mp_representative",
    role_title: "MP Representative",
    assigned_scope: "Assigned MP / relevant works",
    designation: "Member of Parliament Representative",
    jurisdiction: "Assigned MP: Rajesh Sharma (Lok Sabha - Patna Sahib)",
    department: "Parliament of India (Sansad)",
    avatar_initials: "MP",
  },
];

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthUser>;
  quickDemoLogin: (account: DemoAccount) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "sankalp_auth_token";
const USER_KEY = "sankalp_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      const defaultUser: AuthUser = {
        id: 3,
        username: "district_authority",
        email: "district.authority@mplads.gov.in",
        name: "S. Ranganathan, IAS",
        role: "district_authority",
        role_title: "District Authority",
        assigned_scope: "Assigned District",
        designation: "District Collector & District Authority",
        jurisdiction: "Assigned District: South Delhi",
        department: "District Collectorate & Planning Cell",
        avatar_initials: "DA",
      };
      return defaultUser;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await loginAPI({
        username_or_email: usernameOrEmail,
        password,
      });
      setToken(resp.token);
      setUser(resp.user);
      return resp.user;
    } catch (err: any) {
      // Fallback for offline/mock demo users if backend is unreachable
      const matchedDemo = DEMO_ACCOUNTS.find(
        (a) =>
          (a.email.toLowerCase() === usernameOrEmail.toLowerCase().trim() ||
            a.username.toLowerCase() === usernameOrEmail.toLowerCase().trim()) &&
          a.password === password
      );
      if (matchedDemo) {
        const mockUser: AuthUser = {
          id: 99,
          username: matchedDemo.username,
          email: matchedDemo.email,
          name: matchedDemo.name,
          role: matchedDemo.role,
          role_title: matchedDemo.role_title,
          assigned_scope: matchedDemo.assigned_scope,
          designation: matchedDemo.designation,
          jurisdiction: matchedDemo.jurisdiction,
          department: matchedDemo.department,
          avatar_initials: matchedDemo.avatar_initials,
        };
        const mockToken = `sankalp_sec_${Date.now()}`;
        setToken(mockToken);
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickDemoLogin = useCallback(
    async (account: DemoAccount) => {
      return login(account.email, account.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutAPI(token);
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setIsLoading(false);
  }, [token]);

  const updateProfile = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickDemoLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
