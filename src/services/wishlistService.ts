import { supabase } from '@/integrations/supabase/client';

export const wishlistService = {
  async getUserWishlist(userId: string) {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        item_id,
        created_at,
        items (
          id,
          name,
          price_cents,
          img_url,
          author
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addToWishlist(userId: string, itemId: string) {
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, item_id: itemId })
      .select()
      .single();

    if (error) {
      // If it's a duplicate error, that's ok
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }
    return data;
  },

  async removeFromWishlist(userId: string, itemId: string) {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async isInWishlist(userId: string, itemId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Migration helper: migrate localStorage wishlist to database
  async migrateLocalWishlist(userId: string) {
    const key = `wishlist_${userId}`;
    const localWishlist = localStorage.getItem(key);

    if (!localWishlist) return;

    try {
      const items = JSON.parse(localWishlist);

      // Add all items to database wishlist
      for (const item of items) {
        await this.addToWishlist(userId, item.id);
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(key);
      localStorage.removeItem('wishlist'); // Also remove non-user-specific
    } catch (error) {
      console.error('Error migrating wishlist:', error);
    }
  }
};
