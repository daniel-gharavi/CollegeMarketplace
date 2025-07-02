import { supabase } from './supabase';

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

export const createMarketplaceItem = async (itemData) => {
  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([
        {
          ...itemData,
          seller_id: user.id,     
        },
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

export const deleteMarketplaceItem = async (id) => {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    console.log('Current user ID =', user.id);
    console.log('Deleting item ID =', id);

    const { data, error } = await supabase
      .from('marketplace_items')
      .delete()              
      .eq('id', id);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    return { data: null, error };
  }
};

export const getUserItems = async () => {
  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError) throw authError;
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