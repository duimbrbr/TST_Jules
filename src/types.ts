export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface StoreNetwork {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Store {
  id: string;
  network_id?: string;
  network_name?: string;
  name: string;
  store_type: string; // Mercado, Farmácia, Padaria, etc.
  address?: string;
  city?: string;
  state: string;
  created_at?: string;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  unit: string; // un, kg, g, l, ml
  image_url?: string;
  created_at?: string;
}

export interface ShoppingList {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  budget: number;
  share_token: string;
  created_at?: string;
  items_count?: number;
  total_price?: number;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  estimated_price: number;
  actual_price: number;
  store_id?: string;
  is_checked: boolean;
  category: string;
  created_at?: string;
}

export interface ReceiptItem {
  id: string;
  receipt_id?: string;
  product_id?: string;
  product_name: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  store_id?: string;
  store_name?: string;
  network_id?: string;
  network_name?: string;
  access_key?: string;
  url?: string;
  total_amount: number;
  issue_date: string;
  state: string;
  items: ReceiptItem[];
  created_at?: string;
}
