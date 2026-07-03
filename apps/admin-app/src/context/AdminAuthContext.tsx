import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}

interface AdminAuthContextValue {
  session: Session | null;
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminProfile = useCallback(async (user: User) => {
    // CRITICAL: verify admin status server-side via admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      // Not an admin — sign them out immediately
      await supabase.auth.signOut();
      setAdminUser(null);
      setSession(null);
      return;
    }

    // Fetch profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    setAdminUser({
      id: user.id,
      email: user.email ?? '',
      name: profile?.full_name ?? user.email ?? 'Admin',
      role: data.role ?? 'admin',
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchAdminProfile(s.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchAdminProfile(s.user);
      } else {
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdminProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Admin verification happens in onAuthStateChange → fetchAdminProfile
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setSession(null);
  };

  return (
    <AdminAuthContext.Provider value={{
      session,
      adminUser,
      isAuthenticated: !!session && !!adminUser,
      isAdmin: !!adminUser,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
};
