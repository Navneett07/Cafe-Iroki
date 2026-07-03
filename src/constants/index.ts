import type { Coupon } from '../types';

export const CAFE_METADATA = {
  name: 'Cafe Iroki',
  japaneseName: 'कैफे इराकी',
  phone: '09923987861',
  phoneDisplay: '+91 99239 87861',
  whatsappUrl: 'https://wa.me/919923987861',
  locationDisplay: 'Samarth Nagar East, near Ajni Metro Station, Wardha Road, Nagpur',
  address: {
    street: 'Wardha Rd, near Ajni Metro Station, Ajni Chowk, Samarth Nagar East',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440015',
  },
  rating: 4.7,
  reviewsCount: 61,
  priceRange: '₹400–600 per person',
  workingHours: '11:00 AM – 11:00 PM',
  workingHoursShort: 'Open till 11 PM',
  coordinates: {
    lat: 21.1215,
    lng: 79.0820,
  },
};

export const CHARGES = {
  GST_RATE: 0.05, // 5% GST
  DELIVERY_CHARGE: 50, // ₹50 delivery charge
  MIN_FREE_DELIVERY: 600, // Free delivery for orders >= ₹600
};

export const MOCK_COUPONS: Coupon[] = [
  {
    code: 'IROKI10',
    discountPercentage: 10,
    minOrderValue: 400,
    description: 'Get 10% off on orders above ₹400.',
  },
  {
    code: 'SAKURA20',
    discountPercentage: 20,
    minOrderValue: 750,
    description: 'Get 20% off on orders above ₹750.',
  },
  {
    code: 'KOTO30',
    discountPercentage: 30,
    minOrderValue: 1200,
    description: 'Get 30% off on orders above ₹1200.',
  },
];
