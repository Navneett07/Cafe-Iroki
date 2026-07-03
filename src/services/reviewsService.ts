import { supabase } from '../config/supabaseClient';
import type { Review } from '../types';

const mapDbReviewToReview = (db: any): Review => ({
  id: db.id,
  authorName: db.author_name,
  rating: Number(db.rating),
  relativeTime: new Date(db.created_at).toLocaleDateString(),
  text: db.text,
  tags: db.tags || [],
});

export const reviewsService = {
  /**
   * Fetches the list of approved reviews from Supabase.
   */
  async getReviews(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying reviews', error);
      throw error;
    }

    return (data || []).map(mapDbReviewToReview);
  },

  /**
   * Fetches overall rating aggregates dynamically from Supabase database.
   */
  async getReviewsStats() {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('status', 'approved');

    if (error) {
      console.error('Error calculating reviews stats', error);
      throw error;
    }

    const totalReviews = data?.length || 0;
    const totalRating = (data || []).reduce((acc, curr) => acc + Number(curr.rating), 0);
    const averageRating = totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(1)) : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (data || []).forEach((r) => {
      const rat = Math.round(Number(r.rating));
      if (distribution[rat] !== undefined) {
        distribution[rat]++;
      }
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution: distribution,
    };
  },

  /**
   * Submit a new review to Supabase (Defaults to pending state).
   */
  async createReview(rating: number, text: string, authorName: string, tags: string[] = []): Promise<Review> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: session?.user?.id || null,
        rating,
        text,
        author_name: authorName,
        status: 'pending',
        tags,
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting review', error);
      throw error;
    }

    return mapDbReviewToReview(data);
  }
};
