import { StoreNetwork, Store, Product, ShoppingList, ShoppingListItem, Receipt, UserProfile } from '../types';

const STORAGE_KEYS = {
  USER: 'mercadolista_user',
  NETWORKS: 'mercadolista_networks',
  STORES: 'mercadolista_stores',
  PRODUCTS: 'mercadolista_products',
  LISTS: 'mercadolista_lists',
  LIST_ITEMS: 'mercadolista_list_items',
  RECEIPTS: 'mercadolista_receipts',
};

const DEFAULT_NETWORKS: StoreNetwork[] = [
  { id: 'net-1', name: 'Rede Zaffari', description: 'Supermercados e Hipermercados Zaffari e Bourbon' },
  { id: 'net-2', name: 'Carrefour', description: 'Rede internacional de hipermercados' },
  { id: 'net-3', name: 'Panvel', description: 'Rede de Farmácias' },
];

const DEFAULT_STORES: Store[] = [
  { id: 'store-1', network_id: 'net-1', network_name: 'Rede Zaffari', name: 'Zaffari Ipiranga', store_type: 'Supermercado', address: 'Av. Ipiranga, 5200', city: 'Porto Alegre', state: 'RS' },
  { id: 'store-2', network_id: 'net-2', network_name: 'Carrefour', name: 'Carrefour Passo d\'Areia', store_type: 'Hipermercado', address: 'Av. Plínio Brasil Milano, 2343', city: 'Porto Alegre', state: 'RS' },
  { id: 'store-3', network_id: 'net-3', network_name: 'Panvel', name: 'Panvel Moinhos', store_type: 'Farmácia', address: 'Rua Padre Chagas, 120', city: 'Porto Alegre', state: 'RS' },
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod-1', barcode: '7891000100103', name: 'Leite Integral 1L', brand: 'Elegê', category: 'Laticínios', unit: 'l', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80' },
  { id: 'prod-2', barcode: '7891000241011', name: 'Café Torrado e Moído 500g', brand: 'Melitta', category: 'Mercearia', unit: 'un', image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80' },
  { id: 'prod-3', barcode: '7891000300015', name: 'Pão de Forma Tradicional 500g', brand: 'Wickbold', category: 'Padaria', unit: 'un', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' },
  { id: 'prod-4', barcode: '7891000400010', name: 'Sabonete Neutro 90g', brand: 'Dove', category: 'Higiene', unit: 'un', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80' },
];

export const getStoredItem = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading local storage:', e);
    return defaultValue;
  }
};

export const setStoredItem = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing local storage:', e);
  }
};

export const initializeLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.NETWORKS)) {
    setStoredItem(STORAGE_KEYS.NETWORKS, DEFAULT_NETWORKS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
    setStoredItem(STORAGE_KEYS.STORES, DEFAULT_STORES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setStoredItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
};

export const LocalData = {
  getUser: (): UserProfile | null => {
    return getStoredItem<UserProfile | null>(STORAGE_KEYS.USER, {
      id: 'usr-demo-123',
      email: 'usuario.demo@gmail.com',
      full_name: 'Usuário Demo',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });
  },
  setUser: (user: UserProfile | null) => setStoredItem(STORAGE_KEYS.USER, user),

  getNetworks: (): StoreNetwork[] => getStoredItem(STORAGE_KEYS.NETWORKS, DEFAULT_NETWORKS),
  saveNetwork: (network: Omit<StoreNetwork, 'id'> & { id?: string }) => {
    const networks = LocalData.getNetworks();
    const id = network.id || `net-${Date.now()}`;
    const newNetwork = { ...network, id };
    const index = networks.findIndex(n => n.id === id);
    if (index >= 0) networks[index] = newNetwork;
    else networks.push(newNetwork);
    setStoredItem(STORAGE_KEYS.NETWORKS, networks);
    return newNetwork;
  },
  deleteNetwork: (id: string) => {
    const networks = LocalData.getNetworks().filter(n => n.id !== id);
    setStoredItem(STORAGE_KEYS.NETWORKS, networks);
  },

  getStores: (): Store[] => getStoredItem(STORAGE_KEYS.STORES, DEFAULT_STORES),
  saveStore: (store: Omit<Store, 'id'> & { id?: string }) => {
    const stores = LocalData.getStores();
    const networks = LocalData.getNetworks();
    const net = networks.find(n => n.id === store.network_id);
    const id = store.id || `store-${Date.now()}`;
    const newStore = { ...store, id, network_name: net?.name || '' };
    const index = stores.findIndex(s => s.id === id);
    if (index >= 0) stores[index] = newStore;
    else stores.push(newStore);
    setStoredItem(STORAGE_KEYS.STORES, stores);
    return newStore;
  },
  deleteStore: (id: string) => {
    const stores = LocalData.getStores().filter(s => s.id !== id);
    setStoredItem(STORAGE_KEYS.STORES, stores);
  },

  getProducts: (): Product[] => getStoredItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS),
  saveProduct: (product: Omit<Product, 'id'> & { id?: string }) => {
    const products = LocalData.getProducts();
    const id = product.id || `prod-${Date.now()}`;
    const newProduct = { ...product, id };
    const index = products.findIndex(p => p.id === id);
    if (index >= 0) products[index] = newProduct;
    else products.push(newProduct);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },
  deleteProduct: (id: string) => {
    const products = LocalData.getProducts().filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },

  getLists: (): ShoppingList[] => getStoredItem(STORAGE_KEYS.LISTS, [
    {
      id: 'list-1',
      owner_id: 'usr-demo-123',
      title: 'Compras da Semana - Zaffari',
      description: 'Lista de mercado para os mantimentos essenciais da casa',
      budget: 350.00,
      share_token: 'share-token-123',
      created_at: new Date().toISOString()
    }
  ]),
  saveList: (list: Omit<ShoppingList, 'id' | 'share_token'> & { id?: string; share_token?: string }) => {
    const lists = LocalData.getLists();
    const id = list.id || `list-${Date.now()}`;
    const share_token = list.share_token || `share-${Math.random().toString(36).substring(2, 9)}`;
    const newList = { ...list, id, share_token };
    const index = lists.findIndex(l => l.id === id);
    if (index >= 0) lists[index] = newList;
    else lists.push(newList);
    setStoredItem(STORAGE_KEYS.LISTS, lists);
    return newList;
  },
  deleteList: (id: string) => {
    const lists = LocalData.getLists().filter(l => l.id !== id);
    setStoredItem(STORAGE_KEYS.LISTS, lists);
    const allItems = getStoredItem<ShoppingListItem[]>(STORAGE_KEYS.LIST_ITEMS, []).filter(i => i.list_id !== id);
    setStoredItem(STORAGE_KEYS.LIST_ITEMS, allItems);
  },

  getListItems: (listId: string): ShoppingListItem[] => {
    const allItems = getStoredItem<ShoppingListItem[]>(STORAGE_KEYS.LIST_ITEMS, [
      { id: 'li-1', list_id: 'list-1', product_id: 'prod-1', product_name: 'Leite Integral 1L', quantity: 4, estimated_price: 4.89, actual_price: 4.89, store_id: 'store-1', is_checked: true, category: 'Laticínios' },
      { id: 'li-2', list_id: 'list-1', product_id: 'prod-2', product_name: 'Café Torrado e Moído 500g', quantity: 2, estimated_price: 18.50, actual_price: 19.90, store_id: 'store-1', is_checked: false, category: 'Mercearia' },
      { id: 'li-3', list_id: 'list-1', product_id: 'prod-3', product_name: 'Pão de Forma Tradicional 500g', quantity: 1, estimated_price: 8.90, actual_price: 8.90, store_id: 'store-1', is_checked: true, category: 'Padaria' }
    ]);
    return allItems.filter(item => item.list_id === listId);
  },
  saveListItem: (item: Omit<ShoppingListItem, 'id'> & { id?: string }) => {
    const allItems = getStoredItem<ShoppingListItem[]>(STORAGE_KEYS.LIST_ITEMS, []);
    const id = item.id || `li-${Date.now()}`;
    const newItem = { ...item, id };
    const index = allItems.findIndex(i => i.id === id);
    if (index >= 0) allItems[index] = newItem;
    else allItems.push(newItem);
    setStoredItem(STORAGE_KEYS.LIST_ITEMS, allItems);
    return newItem;
  },
  deleteListItem: (id: string) => {
    const allItems = getStoredItem<ShoppingListItem[]>(STORAGE_KEYS.LIST_ITEMS, []);
    const filtered = allItems.filter(i => i.id !== id);
    setStoredItem(STORAGE_KEYS.LIST_ITEMS, filtered);
  },

  getReceipts: (): Receipt[] => getStoredItem(STORAGE_KEYS.RECEIPTS, [
    {
      id: 'rcpt-1',
      user_id: 'usr-demo-123',
      store_id: 'store-1',
      store_name: 'Zaffari Ipiranga',
      network_id: 'net-1',
      network_name: 'Rede Zaffari',
      access_key: '43240900000000000000550010000000011000000001',
      total_amount: 58.26,
      issue_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      state: 'RS',
      items: [
        { id: 'ri-1', product_id: 'prod-1', product_name: 'Leite Integral 1L', barcode: '7891000100103', quantity: 4, unit_price: 4.89, total_price: 19.56 },
        { id: 'ri-2', product_id: 'prod-2', product_name: 'Café Torrado 500g', barcode: '7891000241011', quantity: 1, unit_price: 19.90, total_price: 19.90 },
        { id: 'ri-3', product_id: 'prod-3', product_name: 'Pão de Forma Tradicional', barcode: '7891000300015', quantity: 2, unit_price: 9.40, total_price: 18.80 }
      ]
    },
    {
      id: 'rcpt-2',
      user_id: 'usr-demo-123',
      store_id: 'store-2',
      store_name: 'Carrefour Passo d\'Areia',
      network_id: 'net-2',
      network_name: 'Carrefour',
      access_key: '43240900000000000000550010000000011000000002',
      total_amount: 42.50,
      issue_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      state: 'RS',
      items: [
        { id: 'ri-4', product_id: 'prod-1', product_name: 'Leite Integral 1L', barcode: '7891000100103', quantity: 5, unit_price: 4.50, total_price: 22.50 },
        { id: 'ri-5', product_id: 'prod-4', product_name: 'Sabonete Neutro 90g', barcode: '7891000400010', quantity: 5, unit_price: 4.00, total_price: 20.00 }
      ]
    }
  ]),
  saveReceipt: (receipt: Omit<Receipt, 'id'> & { id?: string }) => {
    const receipts = LocalData.getReceipts();
    const id = receipt.id || `rcpt-${Date.now()}`;
    const newReceipt = { ...receipt, id };
    receipts.push(newReceipt);
    setStoredItem(STORAGE_KEYS.RECEIPTS, receipts);
    return newReceipt;
  }
};

initializeLocalStorage();
