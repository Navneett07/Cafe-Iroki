import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, OrderItem, Coupon } from '../types';
import { CHARGES } from '../constants';
import { supabase } from '../config/supabaseClient';

interface CartContextProps {
  cartItems: OrderItem[];
  favorites: string[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  total: number;
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<string | null>; // Asynchronous DB verification
  removeCoupon: () => void;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const addItem = (item: MenuItem, quantity = 1) => {
    const existingIndex = cartItems.findIndex((ci) => ci.menuItemId === item.id);
    const updated = [...cartItems];

    if (existingIndex > -1) {
      updated[existingIndex].quantity += quantity;
    } else {
      updated.push({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
      });
    }
    setCartItems(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = cartItems.filter((ci) => ci.menuItemId !== itemId);
    setCartItems(updated);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = cartItems.map((ci) =>
      ci.menuItemId === itemId ? { ...ci, quantity } : ci
    );
    setCartItems(updated);
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error || !data) {
        return 'Invalid or expired coupon code.';
      }

      if (subtotal < Number(data.min_order_value)) {
        return `Coupon requires a minimum order subtotal of ₹${data.min_order_value}.`;
      }

      // Convert fixed discounts to relative percentages for compatibility with calculate hooks
      const val = Number(data.value);
      const discountPercentage = data.discount_type === 'percentage' 
        ? val 
        : (val / subtotal) * 100;

      setAppliedCoupon({
        code: data.code,
        discountPercentage: Math.min(100, discountPercentage),
        minOrderValue: Number(data.min_order_value),
        description: data.discount_type === 'percentage' 
          ? `${val}% off` 
          : `₹${val} off`,
      });

      return null;
    } catch (err) {
      console.error('Failed to validate coupon via Supabase API', err);
      return 'Failed to validate coupon.';
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const toggleFavorite = (itemId: string) => {
    const index = favorites.indexOf(itemId);
    const updated = [...favorites];
    if (index > -1) {
      updated.splice(index, 1);
    } else {
      updated.push(itemId);
    }
    setFavorites(updated);
  };

  const isFavorite = (itemId: string) => {
    return favorites.includes(itemId);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  
  // Recalculate coupon eligibility if subtotal drops
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minOrderValue) {
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = taxableAmount * CHARGES.GST_RATE;
  
  const deliveryCharge =
    subtotal === 0 || taxableAmount >= CHARGES.MIN_FREE_DELIVERY ? 0 : CHARGES.DELIVERY_CHARGE;

  const total = taxableAmount + gst + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favorites,
        appliedCoupon,
        subtotal,
        discount,
        gst,
        deliveryCharge,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
