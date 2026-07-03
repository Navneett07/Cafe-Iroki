import type { Review } from '../types';

export const REVIEWS: Review[] = [
  {
    id: 'rev-sujal',
    authorName: 'Sujal Gupta',
    rating: 5,
    relativeTime: '3 weeks ago',
    text: 'Great experience, beautiful ambiance! Must try their UFO burger and Ramen. Perfect spot to chill.',
    tags: ['UFO Burger', 'Ramen', 'Ambiance'],
  },
  {
    id: 'rev-ikshuda',
    authorName: 'Ikshuda',
    rating: 5,
    relativeTime: 'a month ago',
    text: 'Had such a good experience at this cafe ✨ The food was fresh, tasty, and beautifully presented. The ambiance is super cozy and aesthetic — perfect for chilling, dates, or even just relaxing with coffee.',
    tags: ['Cozy Vibes', 'Presentation', 'Aesthetic'],
  },
  {
    id: 'rev-poorva',
    authorName: 'Poorva',
    rating: 5,
    relativeTime: '4 days ago',
    text: 'You will happily overeat in this cafe! 🫶🏻 10/10 food, 10/10 aesthetics, 10/10 recommended. 💗 Excellent Japanese theme!',
    tags: ['10/10 Food', 'Aesthetics', 'Recommended'],
  },
  {
    id: 'rev-pratiksha',
    authorName: 'Pratiksha Nikalje',
    rating: 5,
    relativeTime: '3 weeks ago',
    text: 'Great atmosphere, delicious food, and excellent service. The café has a cozy vibe and is a wonderful spot to hang out with friends or work peacefully.',
    tags: ['Polite Staff', 'Peaceful Workspace'],
  },
  {
    id: 'rev-pranali',
    authorName: 'Pranali Rupchand Kothekar',
    rating: 5,
    relativeTime: 'a month ago',
    text: 'Taiyaki and UFO burger is just osm 💗. I really love the taste. Everything is just 10/10. Highly recommended!',
    tags: ['Taiyaki', 'UFO Burger', 'Delicious'],
  },
  {
    id: 'rev-vedika',
    authorName: 'Vedika Bhadke',
    rating: 5,
    relativeTime: 'a month ago',
    text: 'It was a great experience, nice ambiance and taste too. Garnishing and presentation was outstanding. Iroki gives nice cozy vibes 🫶🏼',
    tags: ['Garnishing', 'Presentation', 'Cozy Vibes'],
  },
  {
    id: 'rev-swati',
    authorName: 'Swati Kedia',
    rating: 5,
    relativeTime: '2 months ago',
    text: 'Had such a delightful experience at Iroki! The vibe is cozy yet aesthetic, giving a perfect little escape into a Japanese café setting. The highlight was definitely the UFO burger—not just visually fun but really yummy.',
    tags: ['UFO Burger', 'Cozy Escape', 'Aesthetic'],
  }
];
export const REVIEWS_STATS = {
  averageRating: 4.7,
  totalReviews: 61,
  ratingDistribution: {
    5: 48,
    4: 8,
    3: 3,
    2: 1,
    1: 1
  }
};
