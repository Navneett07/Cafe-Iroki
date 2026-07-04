import { supabase } from '../config/supabaseClient';
import type { Reservation } from '../types';

const mapDbResToReservation = (db: any): Reservation => ({
  id: db.id,
  guestName: db.guest_name,
  phone: db.phone,
  date: db.date,
  time: db.time,
  guests: db.guests,
  location: db.location as 'indoor' | 'outdoor' | 'balcony',
  tableNumber: db.table_number || undefined,
  specialRequests: db.special_requests || '',
  status: db.status as 'pending' | 'confirmed' | 'cancelled',
});

export const reservationService = {
  /**
   * Fetches all reservations (Admin view) from Supabase.
   */
  async getReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching reservations', error);
      throw error;
    }

    return (data || []).map(mapDbResToReservation);
  },

  /**
   * Creates a new table reservation invoking reservations Supabase Edge Function.
   * Works for both guest (unauthenticated) and logged-in users.
   */
  async createReservation(input: {
    guestName: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    location: 'indoor' | 'outdoor' | 'balcony';
    tableNumber?: string;
    specialRequests?: string;
  }): Promise<Reservation> {
    const { data, error } = await supabase.functions.invoke('reservations', {
      body: {
        action: 'create',
        ...input,
      },
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || 'Failed to create reservation.');
    }

    return mapDbResToReservation(data.reservation);
  },

  /**
   * Cancels a reservation invoking reservations Supabase Edge Function.
   */
  async cancelReservation(id: string): Promise<Reservation> {
    const { data, error } = await supabase.functions.invoke('reservations', {
      body: {
        action: 'cancel',
        reservationId: id,
      },
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || 'Failed to cancel reservation.');
    }

    return mapDbResToReservation(data.reservation);
  },

  /**
   * Updates reservation status (Admin action) directly on Supabase.
   */
  async updateReservationStatus(id: string, status: Reservation['status']): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation status', error);
      throw error;
    }

    return data ? mapDbResToReservation(data) : null;
  }
};
