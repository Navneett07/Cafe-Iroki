import { supabase } from '../config/supabaseClient';
import type { MenuItem } from '../types';

const mapDbItemToMenuItem = (db: any): MenuItem => ({
  id: db.id,
  name: db.name,
  description: db.description,
  price: Number(db.price),
  category: db.category_slug,
  image: db.image_url,
  tags: db.tags || [],
  isVegetarian: db.is_vegetarian,
  isPopular: db.is_popular,
  isInStock: db.is_in_stock ?? true,
});

export const menuService = {
  /**
   * Fetches all menu items from Supabase.
   */
  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu items from Supabase', error);
      throw error;
    }

    return (data || []).map(mapDbItemToMenuItem);
  },

  /**
   * Fetches a single menu item by ID from Supabase.
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching menu item by ID from Supabase', error);
      throw error;
    }

    return data ? mapDbItemToMenuItem(data) : null;
  },

  /**
   * Fetches menu items belonging to a specific category.
   */
  async getMenuItemsByCategory(category: MenuItem['category']): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_slug', category);

    if (error) {
      console.error('Error fetching menu items by category from Supabase', error);
      throw error;
    }

    return (data || []).map(mapDbItemToMenuItem);
  },

  /**
   * Admin: Add a new menu item
   */
  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_slug: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image,
        is_vegetarian: item.isVegetarian,
        is_popular: item.isPopular,
        is_in_stock: true,
        tags: item.tags,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapDbItemToMenuItem(data);
  },

  /**
   * Admin: Delete a menu item
   */
  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};
