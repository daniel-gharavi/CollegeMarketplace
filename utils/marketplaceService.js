import { supabase } from './supabase';

// Get all available marketplace items
export const getMarketplaceItems = async () => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!seller_id (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching marketplace items:', error);
    return { data: null, error };
  }
};

// Search marketplace items
export const searchMarketplaceItems = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!seller_id (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('is_available', true)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching marketplace items:', error);
    return { data: null, error };
  }
};

// Get items by category
export const getItemsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!seller_id (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('is_available', true)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return { data: null, error };
  }
};

// Create a new marketplace item
export const createMarketplaceItem = async (itemData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([
        {
          ...itemData,
          seller_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    return { data: null, error };
  }
};

// Update a marketplace item
export const updateMarketplaceItem = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating marketplace item:', error);
    return { data: null, error };
  }
};

// Delete a marketplace item (soft delete by setting is_available to false)
export const deleteMarketplaceItem = async (id) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({ is_available: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    return { data: null, error };
  }
};

// Get items by current user
export const getUserItems = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user items:', error);
    return { data: null, error };
  }
};

// Get a single item by ID
export const getMarketplaceItem = async (id) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!seller_id (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching marketplace item:', error);
    return { data: null, error };
  }
}; 