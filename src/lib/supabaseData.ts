import { supabase, isSupabaseConfigured } from './supabase';
import { LocalData } from './storage';
import { StoreNetwork, Store, Product, ShoppingList, ShoppingListItem, Receipt } from '../types';

export const SupabaseData = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getProducts();

    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return LocalData.getProducts();
      return data as Product[];
    } catch (e) {
      console.error('Error fetching products from Supabase:', e);
      return LocalData.getProducts();
    }
  },

  async saveProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const localSaved = LocalData.saveProduct(product);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const payload = {
        name: product.name,
        brand: product.brand || null,
        barcode: product.barcode || null,
        category: product.category || 'Geral',
        unit: product.unit || 'un',
        image_url: product.image_url || null,
      };

      if (product.id && !product.id.startsWith('prod-')) {
        const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).select().single();
        if (!error && data) return data as Product;
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (!error && data) return data as Product;
      }
    } catch (e) {
      console.error('Error saving product to Supabase:', e);
    }
    return localSaved;
  },

  async deleteProduct(id: string): Promise<void> {
    LocalData.deleteProduct(id);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting product from Supabase:', e);
    }
  },

  // STORES
  async getStores(): Promise<Store[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getStores();

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*, store_networks(name)')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return LocalData.getStores();

      return data.map((s: any) => ({
        id: s.id,
        network_id: s.network_id,
        network_name: s.store_networks?.name || '',
        name: s.name,
        store_type: s.store_type || 'Mercado',
        address: s.address,
        city: s.city,
        state: s.state || 'RS',
        created_at: s.created_at,
      }));
    } catch (e) {
      console.error('Error fetching stores from Supabase:', e);
      return LocalData.getStores();
    }
  },

  async saveStore(store: Omit<Store, 'id'> & { id?: string }): Promise<Store> {
    const localSaved = LocalData.saveStore(store);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const payload = {
        name: store.name,
        store_type: store.store_type || 'Mercado',
        network_id: store.network_id || null,
        address: store.address || null,
        city: store.city || null,
        state: store.state || 'RS',
      };

      if (store.id && !store.id.startsWith('store-')) {
        const { data, error } = await supabase.from('stores').update(payload).eq('id', store.id).select().single();
        if (!error && data) return data as Store;
      } else {
        const { data, error } = await supabase.from('stores').insert([payload]).select().single();
        if (!error && data) return data as Store;
      }
    } catch (e) {
      console.error('Error saving store to Supabase:', e);
    }
    return localSaved;
  },

  async deleteStore(id: string): Promise<void> {
    LocalData.deleteStore(id);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('stores').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting store from Supabase:', e);
    }
  },

  // NETWORKS
  async getNetworks(): Promise<StoreNetwork[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getNetworks();

    try {
      const { data, error } = await supabase.from('store_networks').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return LocalData.getNetworks();
      return data as StoreNetwork[];
    } catch (e) {
      console.error('Error fetching networks from Supabase:', e);
      return LocalData.getNetworks();
    }
  },

  async saveNetwork(network: Omit<StoreNetwork, 'id'> & { id?: string }): Promise<StoreNetwork> {
    const localSaved = LocalData.saveNetwork(network);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const payload = {
        name: network.name,
        description: network.description || null,
      };

      if (network.id && !network.id.startsWith('net-')) {
        const { data, error } = await supabase.from('store_networks').update(payload).eq('id', network.id).select().single();
        if (!error && data) return data as StoreNetwork;
      } else {
        const { data, error } = await supabase.from('store_networks').insert([payload]).select().single();
        if (!error && data) return data as StoreNetwork;
      }
    } catch (e) {
      console.error('Error saving network to Supabase:', e);
    }
    return localSaved;
  },

  async deleteNetwork(id: string): Promise<void> {
    LocalData.deleteNetwork(id);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('store_networks').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting network from Supabase:', e);
    }
  },

  // SHOPPING LISTS
  async getLists(): Promise<ShoppingList[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getLists();

    try {
      const { data, error } = await supabase.from('shopping_lists').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return LocalData.getLists();
      return data as ShoppingList[];
    } catch (e) {
      console.error('Error fetching shopping lists from Supabase:', e);
      return LocalData.getLists();
    }
  },

  async saveList(list: Omit<ShoppingList, 'id' | 'share_token'> & { id?: string; share_token?: string }): Promise<ShoppingList> {
    const localSaved = LocalData.saveList(list);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        owner_id: user?.id || null,
        title: list.title,
        description: list.description || null,
        budget: list.budget || 0,
      };

      if (list.id && !list.id.startsWith('list-')) {
        const { data, error } = await supabase.from('shopping_lists').update(payload).eq('id', list.id).select().single();
        if (!error && data) return data as ShoppingList;
      } else {
        const { data, error } = await supabase.from('shopping_lists').insert([payload]).select().single();
        if (!error && data) return data as ShoppingList;
      }
    } catch (e) {
      console.error('Error saving shopping list to Supabase:', e);
    }
    return localSaved;
  },

  async deleteList(id: string): Promise<void> {
    LocalData.deleteList(id);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('shopping_lists').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting shopping list from Supabase:', e);
    }
  },

  // SHOPPING LIST ITEMS
  async getListItems(listId: string): Promise<ShoppingListItem[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getListItems(listId);

    try {
      const { data, error } = await supabase.from('shopping_list_items').select('*').eq('list_id', listId).order('created_at', { ascending: true });
      if (error || !data || data.length === 0) return LocalData.getListItems(listId);
      return data as ShoppingListItem[];
    } catch (e) {
      console.error('Error fetching list items from Supabase:', e);
      return LocalData.getListItems(listId);
    }
  },

  async saveListItem(item: Omit<ShoppingListItem, 'id'> & { id?: string }): Promise<ShoppingListItem> {
    const localSaved = LocalData.saveListItem(item);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const payload = {
        list_id: item.list_id,
        product_id: item.product_id && !item.product_id.startsWith('prod-') ? item.product_id : null,
        product_name: item.product_name,
        quantity: item.quantity || 1,
        estimated_price: item.estimated_price || 0,
        actual_price: item.actual_price || 0,
        store_id: item.store_id && !item.store_id.startsWith('store-') ? item.store_id : null,
        is_checked: item.is_checked || false,
        category: item.category || 'Geral',
      };

      if (item.id && !item.id.startsWith('li-')) {
        const { data, error } = await supabase.from('shopping_list_items').update(payload).eq('id', item.id).select().single();
        if (!error && data) return data as ShoppingListItem;
      } else {
        const { data, error } = await supabase.from('shopping_list_items').insert([payload]).select().single();
        if (!error && data) return data as ShoppingListItem;
      }
    } catch (e) {
      console.error('Error saving list item to Supabase:', e);
    }
    return localSaved;
  },

  async deleteListItem(id: string): Promise<void> {
    LocalData.deleteListItem(id);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('shopping_list_items').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting list item from Supabase:', e);
    }
  },

  // RECEIPTS
  async getReceipts(): Promise<Receipt[]> {
    if (!isSupabaseConfigured || !supabase) return LocalData.getReceipts();

    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*, receipt_items(*), stores(name, store_networks(name))')
        .order('issue_date', { ascending: false });

      if (error || !data || data.length === 0) return LocalData.getReceipts();

      return data.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        store_id: r.store_id,
        store_name: r.stores?.name || 'Mercado',
        network_name: r.stores?.store_networks?.name || '',
        access_key: r.access_key,
        url: r.url,
        total_amount: Number(r.total_amount),
        issue_date: r.issue_date,
        state: r.state || 'RS',
        items: (r.receipt_items || []).map((ri: any) => ({
          id: ri.id,
          receipt_id: ri.receipt_id,
          product_id: ri.product_id,
          product_name: ri.product_name,
          barcode: ri.barcode,
          quantity: Number(ri.quantity),
          unit_price: Number(ri.unit_price),
          total_price: Number(ri.total_price),
        })),
      }));
    } catch (e) {
      console.error('Error fetching receipts from Supabase:', e);
      return LocalData.getReceipts();
    }
  },

  async saveReceipt(receipt: Omit<Receipt, 'id'> & { id?: string }): Promise<Receipt> {
    const localSaved = LocalData.saveReceipt(receipt);
    if (!isSupabaseConfigured || !supabase) return localSaved;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const receiptPayload = {
        user_id: user?.id || null,
        store_id: receipt.store_id && !receipt.store_id.startsWith('store-') ? receipt.store_id : null,
        access_key: receipt.access_key || null,
        url: receipt.url || null,
        total_amount: receipt.total_amount,
        issue_date: receipt.issue_date || new Date().toISOString(),
        state: receipt.state || 'RS',
      };

      const { data: savedReceipt, error: rError } = await supabase
        .from('receipts')
        .insert([receiptPayload])
        .select()
        .single();

      if (!rError && savedReceipt && receipt.items && receipt.items.length > 0) {
        const itemsPayload = receipt.items.map((item) => ({
          receipt_id: savedReceipt.id,
          product_name: item.product_name,
          barcode: item.barcode || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        await supabase.from('receipt_items').insert(itemsPayload);
        return { ...savedReceipt, items: receipt.items };
      }
    } catch (e) {
      console.error('Error saving receipt to Supabase:', e);
    }
    return localSaved;
  }
};
