import { supabase, isSupabaseConfigured } from './supabase';
import { LocalData } from './storage';
import { StoreNetwork, Store, Product, ShoppingList, ShoppingListItem, Receipt, ReceiptItem } from '../types';

const requireClient = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

const databaseError = (action: string, error: unknown): never => {
  console.error(`Error ${action} in Supabase:`, error);
  throw new Error('Não foi possível salvar os dados no servidor. Tente novamente.');
};

export const SupabaseData = {
  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured) return LocalData.getProducts();
    const { data, error } = await requireClient().from('products').select('*').order('created_at', { ascending: false });
    if (error) return databaseError('fetching products', error);
    return (data ?? []) as Product[];
  },
  async saveProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    if (!isSupabaseConfigured) return LocalData.saveProduct(product);
    const client = requireClient();
    const payload = { name: product.name, brand: product.brand || null, barcode: product.barcode || null, category: product.category || 'Geral', unit: product.unit || 'un', image_url: product.image_url || null };
    const result = product.id ? await client.from('products').update(payload).eq('id', product.id).select().single() : await client.from('products').insert(payload).select().single();
    if (result.error || !result.data) return databaseError('saving product', result.error);
    return result.data as Product;
  },
  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return LocalData.deleteProduct(id);
    const { error } = await requireClient().from('products').delete().eq('id', id);
    if (error) databaseError('deleting product', error);
  },
  async getStores(): Promise<Store[]> {
    if (!isSupabaseConfigured) return LocalData.getStores();
    const { data, error } = await requireClient().from('stores').select('*, store_networks(name)').order('created_at', { ascending: false });
    if (error) return databaseError('fetching stores', error);
    return (data ?? []).map((store) => ({ ...store, network_name: (store.store_networks as { name?: string } | null)?.name || '' })) as Store[];
  },
  async saveStore(store: Omit<Store, 'id'> & { id?: string }): Promise<Store> {
    if (!isSupabaseConfigured) return LocalData.saveStore(store);
    const client = requireClient();
    const payload = { name: store.name, store_type: store.store_type || 'Mercado', network_id: store.network_id || null, address: store.address || null, city: store.city || null, state: store.state || 'RS' };
    const result = store.id ? await client.from('stores').update(payload).eq('id', store.id).select().single() : await client.from('stores').insert(payload).select().single();
    if (result.error || !result.data) return databaseError('saving store', result.error);
    return result.data as Store;
  },
  async deleteStore(id: string): Promise<void> {
    if (!isSupabaseConfigured) return LocalData.deleteStore(id);
    const { error } = await requireClient().from('stores').delete().eq('id', id);
    if (error) databaseError('deleting store', error);
  },
  async getNetworks(): Promise<StoreNetwork[]> {
    if (!isSupabaseConfigured) return LocalData.getNetworks();
    const { data, error } = await requireClient().from('store_networks').select('*').order('created_at', { ascending: false });
    if (error) return databaseError('fetching networks', error);
    return (data ?? []) as StoreNetwork[];
  },
  async saveNetwork(network: Omit<StoreNetwork, 'id'> & { id?: string }): Promise<StoreNetwork> {
    if (!isSupabaseConfigured) return LocalData.saveNetwork(network);
    const client = requireClient(); const payload = { name: network.name, description: network.description || null };
    const result = network.id ? await client.from('store_networks').update(payload).eq('id', network.id).select().single() : await client.from('store_networks').insert(payload).select().single();
    if (result.error || !result.data) return databaseError('saving network', result.error);
    return result.data as StoreNetwork;
  },
  async deleteNetwork(id: string): Promise<void> {
    if (!isSupabaseConfigured) return LocalData.deleteNetwork(id);
    const { error } = await requireClient().from('store_networks').delete().eq('id', id);
    if (error) databaseError('deleting network', error);
  },
  async getLists(): Promise<ShoppingList[]> {
    if (!isSupabaseConfigured) return LocalData.getLists();
    const { data, error } = await requireClient().from('shopping_lists').select('*').order('created_at', { ascending: false });
    if (error) return databaseError('fetching lists', error);
    return (data ?? []) as ShoppingList[];
  },
  async getListByShareToken(token: string): Promise<ShoppingList | null> {
    if (!isSupabaseConfigured) return LocalData.getLists().find((list) => list.share_token === token) ?? null;
    const { data, error } = await requireClient().rpc('get_shared_list', { token });
    if (error) return databaseError('fetching shared list', error);
    return data ? data as ShoppingList : null;
  },
  async getSharedListItems(token: string): Promise<ShoppingListItem[]> {
    if (!isSupabaseConfigured) {
      const list = LocalData.getLists().find((entry) => entry.share_token === token);
      return list ? LocalData.getListItems(list.id) : [];
    }
    const { data, error } = await requireClient().rpc('get_shared_list_items', { token });
    if (error) return databaseError('fetching shared list items', error);
    return (data ?? []) as ShoppingListItem[];
  },
  async saveList(list: Omit<ShoppingList, 'id' | 'share_token'> & { id?: string; share_token?: string }): Promise<ShoppingList> {
    if (!isSupabaseConfigured) return LocalData.saveList(list);
    const client = requireClient(); const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Faça login para salvar uma lista sincronizada.');
    const payload = { owner_id: user.id, title: list.title, description: list.description || null, budget: list.budget || 0 };
    const result = list.id ? await client.from('shopping_lists').update(payload).eq('id', list.id).select().single() : await client.from('shopping_lists').insert(payload).select().single();
    if (result.error || !result.data) return databaseError('saving list', result.error);
    return result.data as ShoppingList;
  },
  async deleteList(id: string): Promise<void> {
    if (!isSupabaseConfigured) return LocalData.deleteList(id);
    const { error } = await requireClient().from('shopping_lists').delete().eq('id', id);
    if (error) databaseError('deleting list', error);
  },
  async getListItems(listId: string): Promise<ShoppingListItem[]> {
    if (!isSupabaseConfigured) return LocalData.getListItems(listId);
    const { data, error } = await requireClient().from('shopping_list_items').select('*').eq('list_id', listId).order('created_at');
    if (error) return databaseError('fetching list items', error);
    return (data ?? []) as ShoppingListItem[];
  },
  async saveListItem(item: Omit<ShoppingListItem, 'id'> & { id?: string }): Promise<ShoppingListItem> {
    if (!isSupabaseConfigured) return LocalData.saveListItem(item);
    const client = requireClient(); const payload = { list_id: item.list_id, product_id: item.product_id || null, product_name: item.product_name, quantity: item.quantity, estimated_price: item.estimated_price, actual_price: item.actual_price, store_id: item.store_id || null, is_checked: item.is_checked, category: item.category || 'Geral' };
    const result = item.id ? await client.from('shopping_list_items').update(payload).eq('id', item.id).select().single() : await client.from('shopping_list_items').insert(payload).select().single();
    if (result.error || !result.data) return databaseError('saving list item', result.error);
    return result.data as ShoppingListItem;
  },
  async deleteListItem(id: string): Promise<void> {
    if (!isSupabaseConfigured) return LocalData.deleteListItem(id);
    const { error } = await requireClient().from('shopping_list_items').delete().eq('id', id);
    if (error) databaseError('deleting list item', error);
  },
  async getReceipts(): Promise<Receipt[]> {
    if (!isSupabaseConfigured) return LocalData.getReceipts();
    const { data, error } = await requireClient().from('receipts').select('*, receipt_items(*), stores(name, network_id, store_networks(name))').order('issue_date', { ascending: false });
    if (error) return databaseError('fetching receipts', error);
    return (data ?? []).map((receipt) => {
      const store = receipt.stores as { name?: string; network_id?: string; store_networks?: { name?: string } | null } | null;
      return { ...receipt, total_amount: Number(receipt.total_amount), store_name: store?.name || 'Mercado', network_id: store?.network_id, network_name: store?.store_networks?.name || '', items: ((receipt.receipt_items as ReceiptItem[] | null) ?? []).map((item) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price), total_price: Number(item.total_price) })) } as Receipt;
    });
  },
  async saveReceipt(receipt: Omit<Receipt, 'id'> & { id?: string }): Promise<Receipt> {
    if (!isSupabaseConfigured) return LocalData.saveReceipt(receipt);
    const client = requireClient(); const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Faça login para salvar uma nota sincronizada.');
    const receiptPayload = { user_id: user.id, store_id: receipt.store_id || null, access_key: receipt.access_key || null, url: receipt.url || null, total_amount: receipt.total_amount, issue_date: receipt.issue_date, state: receipt.state || 'RS' };
    const { data: saved, error } = await client.from('receipts').insert(receiptPayload).select().single();
    if (error || !saved) return databaseError('saving receipt', error);
    if (receipt.items.length) { const { error: itemError } = await client.from('receipt_items').insert(receipt.items.map(({ id: _id, receipt_id: _receiptId, ...item }) => ({ ...item, receipt_id: saved.id, product_id: item.product_id || null, barcode: item.barcode || null }))); if (itemError) return databaseError('saving receipt items', itemError); }
    return { ...saved, items: receipt.items } as Receipt;
  },
};
