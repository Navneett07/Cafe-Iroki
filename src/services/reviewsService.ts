import type { Review } from '../types';
import { REVIEWS, REVIEWS_STATS } from '../data/reviews';

export const reviewsService = {
  /**
   * Fetches the list of reviews.
   */
  async getReviews(): Promise<Review[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...REVIEWS]);
      }, 500);
    });
  },

  /**
   * Fetches overall rating aggregates.
   */
  async getReviewsStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...REVIEWS_STATS });
      }, 300);
    });
  }
};
