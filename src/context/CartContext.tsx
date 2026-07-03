import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MenuItem, OrderItem, Coupon } from '../types';
import { CHARGES } from '../constants';
import { supabase } from '../config/supabaseClient';
import { useAuth } from './AuthContext';
import { useRealtimeChannel } from '../hooks/useRealtimeChannel';

interface CartContextProps {
  cartItems: OrderItem[];
  favorites: string[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  total: number;
  addItem: (item: MenuItem, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => void;
  toggleFavorite: (itemId: string) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // 1. Sync cart/favorites from database when user updates
  const loadUserData = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setFavorites([]);
      return;
    }
    try {
      // Pull cart
      const { data: cartData } = await supabase
        .from('cart_items')
        .select('*, menu_items(name, price)')
        .eq('user_id', user.id);

      if (cartData) {
        setCartItems(
          cartData.map((c: any) => ({
            menuItemId: c.menu_item_id,
            name: c.menu_items?.name || '',
            price: Number(c.menu_items?.price || 0),
            quantity: c.quantity,
          }))
        );
      }

      // Pull favorites
      const { data: favsData } = await supabase
        .from('favorite_items')
        .select('menu_item_id')
        .eq('user_id', user.id);

      if (favsData) {
        setFavorites(favsData.map((f: any) => f.menu_item_id));
      }
    } catch (err) {
      console.error('Failed to sync user cart metrics:', err);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // 1b. Live cross-device sync: reflect cart/favorite changes made on other
  // devices/tabs. RLS restricts these streams to the user's own rows.
  useRealtimeChannel({
    channel: user ? `cart-sync-${user.id}` : 'cart-sync',
    table: 'cart_items',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: loadUserData,
    onResync: loadUserData,
  });

  useRealtimeChannel({
    channel: user ? `favorites-sync-${user.id}` : 'favorites-sync',
    table: 'favorite_items',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: loadUserData,
    onResync: loadUserData,
  });

  // 2. Operations
  const addItem = async (item: MenuItem, quantity = 1) => {
    const existingIndex = cartItems.findIndex((ci) => ci.menuItemId === item.id);
    const updated = [...cartItems];
    let newQty = quantity;

    if (existingIndex > -1) {
      newQty = updated[existingIndex].quantity + quantity;
      updated[existingIndex].quantity = newQty;
    } else {
      updated.push({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
      });
    }
    setCartItems(updated);

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            menu_item_id: item.id,
            quantity: newQty,
          }, {
            onConflict: 'user_id,menu_item_id'
          });
      } catch (err) {
        console.error('Database cart sync error', err);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    const updated = cartItems.filter((ci) => ci.menuItemId !== itemId);
    setCartItems(updated);

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('menu_item_id', itemId);
      } catch (err) {
        console.error('Database cart delete error', err);
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    const updated = cartItems.map((ci) =>
      ci.menuItemId === itemId ? { ...ci, quantity } : ci
    );
    setCartItems(updated);

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('menu_item_id', itemId);
      } catch (err) {
        console.error('Database cart update error', err);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    setAppliedCoupon(null);

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Database cart clear error', err);
      }
    }
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
      console.error('Failed to validate coupon', err);
      return 'Failed to validate coupon.';
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const toggleFavorite = async (itemId: string) => {
    const index = favorites.indexOf(itemId);
    const updated = [...favorites];
    const isAdding = index === -1;

    if (isAdding) {
      updated.push(itemId);
    } else {
      updated.splice(index, 1);
    }
    setFavorites(updated);

    if (user) {
      try {
        if (isAdding) {
          await supabase
            .from('favorite_items')
            .insert({
              user_id: user.id,
              menu_item_id: itemId,
            });
        } else {
          await supabase
            .from('favorite_items')
            .delete()
            .eq('user_id', user.id)
            .eq('menu_item_id', itemId);
        }
      } catch (err) {
        console.error('Database favorites sync error', err);
      }
    }
  };

  const isFavorite = (itemId: string) => {
    return favorites.includes(itemId);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minOrderValue) {
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = taxableAmount * CHARGES.GST_RATE;
  const deliveryCharge = subtotal === 0 || taxableAmount >= CHARGES.MIN_FREE_DELIVERY ? 0 : CHARGES.DELIVERY_CHARGE;
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
