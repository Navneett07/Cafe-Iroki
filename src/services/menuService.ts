import { supabase } from '../config/supabaseClient';
import type { MenuItem } from '../types';
import { MENU_ITEMS } from '../data/menu';

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
});

export const menuService = {
  /**
   * Fetches all menu items from Supabase. Falls back to static menu items if Supabase is unconfigured or fails.
   */
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Safe check for placeholders or unconfigured credentials
      if (
        !supabaseUrl || 
        !supabaseAnonKey || 
        supabaseUrl.includes('placeholder') || 
        supabaseAnonKey.includes('placeholder')
      ) {
        console.warn('Supabase is unconfigured or uses placeholders. Using local static menu items fallback.');
        return [...MENU_ITEMS];
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase query error. Falling back to local static menu items:', error);
        return [...MENU_ITEMS];
      }

      // If categories/items are empty, seed them automatically
      if (!data || data.length === 0) {
        console.info('Database menu_items table is empty. Auto-seeding static menu items...');
        await this.seedCategoriesAndItems();
        return [...MENU_ITEMS];
      }

      return data.map(mapDbItemToMenuItem);
    } catch (err) {
      console.error('Failed to communicate with Supabase database. Falling back to local menu items:', err);
      return [...MENU_ITEMS];
    }
  },

  /**
   * Fetches a single menu item by ID from Supabase with fallback.
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return MENU_ITEMS.find((m) => m.id === id) || null;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        // Fallback search locally
        return MENU_ITEMS.find((m) => m.id === id) || null;
      }

      return mapDbItemToMenuItem(data);
    } catch (err) {
      return MENU_ITEMS.find((m) => m.id === id) || null;
    }
  },

  /**
   * Fetches menu items belonging to a specific category.
   */
  async getMenuItemsByCategory(category: MenuItem['category']): Promise<MenuItem[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return MENU_ITEMS.filter((m) => m.category === category);
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_slug', category);

      if (error) {
        return MENU_ITEMS.filter((m) => m.category === category);
      }

      return (data || []).map(mapDbItemToMenuItem);
    } catch (err) {
      return MENU_ITEMS.filter((m) => m.category === category);
    }
  },

  /**
   * Helper function to seed categories and items into Supabase.
   */
  async seedCategoriesAndItems(): Promise<void> {
    try {
      const uniqueCats = Array.from(new Set(MENU_ITEMS.map((item) => item.category)));
      
      const categoriesToInsert = uniqueCats.map((cat) => ({
        name: cat.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        slug: cat,
        description: `Premium ${cat} choices at Cafe Iroki`,
        is_active: true,
      }));

      // Seed categories (upsert based on unique slug)
      const { error: catError } = await supabase
        .from('categories')
        .upsert(categoriesToInsert, { onConflict: 'slug' });

      if (catError) {
        console.error('Seeding categories failed:', catError);
        return;
      }

      // Seed menu items
      const itemsToInsert = MENU_ITEMS.map((item) => ({
        id: item.id,
        category_slug: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image,
        is_vegetarian: item.isVegetarian,
        is_popular: item.isPopular || false,
        is_in_stock: true,
        tags: item.tags,
      }));

      const { error: itemError } = await supabase
        .from('menu_items')
        .upsert(itemsToInsert, { onConflict: 'id' });

      if (itemError) {
        console.error('Seeding menu items failed:', itemError);
      } else {
        console.info('Successfully seeded categories and menu items on Supabase PostgreSQL!');
      }
    } catch (err) {
      console.error('Seeding process encountered an exception:', err);
    }
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
