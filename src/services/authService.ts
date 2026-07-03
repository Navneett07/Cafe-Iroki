import { supabase } from '../config/supabaseClient';
import type { User } from '../types';

export const authService = {
  /**
   * Logs in a user using Supabase Auth and fetches their profile role.
   */
  async login(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Login failed.');
    }

    // Fetch user profile to check roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Fallback if profile doesn't exist yet
      return {
        id: authData.user.id,
        email: authData.user.email || email,
        role: 'customer',
        name: 'Guest User',
      };
    }

    return {
      id: authData.user.id,
      email: authData.user.email || email,
      role: profile.role as 'admin' | 'customer',
      name: profile.full_name,
    };
  },

  /**
   * Registers a new customer using Supabase Auth.
   */
  async signUp(email: string, password: string, fullName: string, phone: string): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Reads current authenticated user profile session.
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: (profile?.role as 'admin' | 'customer') || 'customer',
      name: profile?.full_name || 'Valued Guest',
    };
  },

  /**
   * Clears the current session.
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Resets password request.
   */
  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    if (error) {
      throw new Error(error.message);
    }
  }
};
