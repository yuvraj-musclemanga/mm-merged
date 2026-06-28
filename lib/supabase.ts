import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const updateUserProfile = async (userId: string, updates: { username?: string; phone?: string; full_name?: string }) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .single();

  return { data, error };
};

export const verifyAndChangePassword = async (email: string, currentPassword: string, newPassword: string) => {
  // 1. Re-authenticate to verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: signInError };
  }

  // 2. Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError };
  }

  return { success: true };
};

export interface Address {
  id: string;
  user_id: string;
  label: string;
  house_building_name: string;
  area_sector: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  receiver_name: string;
  receiver_email: string;
  receiver_phone: string;
  is_default: boolean;
  created_at: string;
}

export const getAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const addAddress = async (addressData: Omit<Address, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('addresses')
    .insert([addressData])
    .select()
    .single();

  if (error) {
    console.error("Supabase addAddress Error:", JSON.stringify(error, null, 2));
  }
  return { data, error };
};

export const updateAddress = async (addressId: string, addressData: Partial<Address>) => {
  const { data, error } = await supabase
    .from('addresses')
    .update(addressData)
    .eq('id', addressId)
    .select()
    .single();

  if (error) {
    console.error("Supabase updateAddress Error:", JSON.stringify(error, null, 2));
  }
  return { data, error };
};

export const deleteAddress = async (addressId: string) => {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);

  return { error };
};

export const setDefaultAddress = async (userId: string, addressId: string) => {
  // Reset all other addresses for this user
  const { error: resetError } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);

  if (resetError) return { error: resetError };

  // Set the specific address as default
  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .select()
    .single();

  return { data, error };
};

// -- CART DB FUNCTIONS --

export const getDBCartItems = async (userId: string) => {
  // 1. Get or create the cart
  let { data: cart, error: fetchError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error("Supabase getDBCart Error:", JSON.stringify(fetchError, null, 2));
  }

  if (!cart) {
    const { data: newCart, error: insertError } = await supabase
      .from('carts')
      .insert([{ user_id: userId }])
      .select('id')
      .single();
    
    if (insertError) {
      console.error("Supabase createCart Error:", JSON.stringify(insertError, null, 2));
      return { items: [], cartId: null };
    }
    if (!newCart) return { items: [], cartId: null };
    cart = newCart;
  }

  // 2. Fetch cart items
  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      variant_id,
      product_variants (
        id,
        size,
        price,
        product_id,
        products (
          id,
          name,
          product_images (image_url)
        )
      )
    `)
    .eq('cart_id', cart.id);

  if (itemsError) {
    console.error("Supabase fetchCartItems Error:", JSON.stringify(itemsError, null, 2));
  }

  // Normalize to CartItem format
  const normalizedItems = (items || []).map((item: any) => {
    const variant = item.product_variants;
    const product = variant.products;
    const image = product.product_images?.[0]?.image_url || '';

    return {
      dbId: item.id,
      cart_id: cart.id,
      id: product.id,
      variant_id: variant.id,
      name: product.name,
      price: variant.price,
      image,
      size: variant.size,
      quantity: item.quantity,
      description: ''
    };
  });

  return { items: normalizedItems, cartId: cart.id };
};

export const syncDBCartItems = async (cartId: string, itemsToSync: any[]) => {
  // 1. Deduplicate by variant_id
  const uniqueItems = itemsToSync.reduce((acc: any[], current: any) => {
    const existing = acc.find(item => item.variant_id === current.variant_id);
    if (existing) {
      existing.quantity += current.quantity;
    } else if (current.variant_id) {
      acc.push({ ...current });
    }
    return acc;
  }, []);

  if (uniqueItems.length === 0) {
    // If empty, just clear everything
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
    return { success: !error };
  }

  // 2. Prepare UPSERT rows
  const _upsertRows = uniqueItems.map(item => ({
    cart_id: cartId,
    variant_id: item.variant_id,
    quantity: item.quantity
  }));

  // 3. Perform UPSERT (Insert new or update quantity)
  // This uses the unique constraint on (cart_id, variant_id)
  const { error: upsertError } = await supabase
    .from('cart_items')
    .upsert(_upsertRows, { onConflict: 'cart_id,variant_id' });

  if (upsertError) {
    console.error("Supabase syncDBCart-Upsert Error:", JSON.stringify(upsertError, null, 2));
    return { success: false };
  }

  // 4. Cleanup: Delete any items that are in the database but NOT in our new list
  const variantIds = uniqueItems.map(item => item.variant_id);
  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)
    .not('variant_id', 'in', `(${variantIds.join(',')})`);

  if (deleteError) {
    console.error("Supabase syncDBCart-Cleanup Error:", JSON.stringify(deleteError, null, 2));
  }

  return { success: true };
};

export const updateDBCartItem = async (cartItemId: string, quantity: number) => {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
  return { success: !error };
};

export const deleteDBCartItem = async (cartItemId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  return { success: !error };
};

export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product_variants (
          id,
          products (
            id,
            name,
            product_images (image_url)
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase getUserOrders Error:", error);
  }
  return { data, error };
};

export const getWishlist = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      id,
      product_id,
      products (
        *,
        product_images (image_url, position),
        product_variants (*)
      )
    `)
    .eq('user_id', userId);
  return { data, error };
};

export const addToWishlist = async (userId: string, productId: string) => {
  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: userId, product_id: productId });
  return { error };
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  return { error };
};
