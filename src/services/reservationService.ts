import { supabase } from '../config/supabaseClient';
import type { Reservation } from '../types';

const mapDbResToReservation = (db: any): Reservation => ({
  id: db.id,
  guestName: db.guest_name,
  email: db.email,
  phone: db.phone,
  date: db.date,
  time: db.time,
  guests: db.guests,
  location: db.location as 'indoor' | 'outdoor' | 'balcony',
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
   * Creates a new table reservation on Supabase.
   */
  async createReservation(input: Omit<Reservation, 'id' | 'status'>): Promise<Reservation> {
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: session?.user?.id || null,
        guest_name: input.guestName,
        email: input.email,
        phone: input.phone,
        date: input.date,
        time: input.time,
        guests: input.guests,
        location: input.location,
        special_requests: input.specialRequests,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting reservation', error);
      throw error;
    }

    return mapDbResToReservation(data);
  },

  /**
   * Updates reservation status (Admin action) on Supabase.
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
