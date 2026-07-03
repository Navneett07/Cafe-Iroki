import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, OrderItem, Coupon } from '../types';
import { CHARGES, MOCK_COUPONS } from '../constants';

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
  applyCoupon: (code: string) => string | null; // Returns error message or null if successful
  removeCoupon: () => void;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Load cart and favorites from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('iroki_cart');
    const savedFavorites = localStorage.getItem('iroki_favorites');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Sync cart changes to storage
  const saveCart = (items: OrderItem[]) => {
    setCartItems(items);
    localStorage.setItem('iroki_cart', JSON.stringify(items));
  };

  // Sync favorites changes to storage
  const saveFavorites = (favs: string[]) => {
    setFavorites(favs);
    localStorage.setItem('iroki_favorites', JSON.stringify(favs));
  };

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
    saveCart(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = cartItems.filter((ci) => ci.menuItemId !== itemId);
    saveCart(updated);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = cartItems.map((ci) =>
      ci.menuItemId === itemId ? { ...ci, quantity } : ci
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): string | null => {
    const coupon = MOCK_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    
    if (!coupon) {
      return 'Invalid coupon code.';
    }

    if (subtotal < coupon.minOrderValue) {
      return `Coupon requires a minimum order subtotal of ₹${coupon.minOrderValue}.`;
    }

    setAppliedCoupon(coupon);
    return null;
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
    saveFavorites(updated);
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
