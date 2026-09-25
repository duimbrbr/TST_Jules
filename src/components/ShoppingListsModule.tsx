import React, { useState, useEffect } from 'react';
import { ShoppingList, ShoppingListItem, Product, Store } from '../types';
import { SupabaseData } from '../lib/supabaseData';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { fetchProductByBarcode } from '../services/openFoodFactsService';
import {
  List, Plus, Share2, Trash2, CheckSquare, Square, Scan,
  DollarSign, ShoppingCart, ArrowLeft, Copy, Check, MessageSquare, Loader2, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShoppingListsModule: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Modal States
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Open Food Facts API State inside Shopping List Item Modal
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New List Form
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listBudget, setListBudget] = useState('350.00');

  // Item Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('0.00');
  const [itemCategory, setItemCategory] = useState('Mercearia');
  const [itemStoreId, setItemStoreId] = useState('');

  const loadInitialData = async () => {
    const fetchedLists = await SupabaseData.getLists();
    const fetchedProducts = await SupabaseData.getProducts();
    const fetchedStores = await SupabaseData.getStores();

    setLists(fetchedLists);
    setProducts(fetchedProducts);
    setStores(fetchedStores);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedList) {
      SupabaseData.getListItems(selectedList.id).then(setItems);
    }
  }, [selectedList]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim()) return;

    const newList = await SupabaseData.saveList({
      owner_id: '',
      title: listTitle,
      description: listDesc,
      budget: parseFloat(listBudget) || 0,
    });

    const refreshedLists = await SupabaseData.getLists();
    setLists(refreshedLists);
    setSelectedList(newList);
    setShowNewListModal(false);
    setListTitle('');
    setListDesc('');
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !itemName.trim()) return;

    await SupabaseData.saveListItem({
      list_id: selectedList.id,
      product_id: selectedProductId || undefined,
      product_name: itemName,
      quantity: parseFloat(itemQty) || 1,
      estimated_price: parseFloat(itemPrice) || 0,
      actual_price: parseFloat(itemPrice) || 0,
      category: itemCategory,
      store_id: itemStoreId || undefined,
      is_checked: false,
    });

    const refreshedItems = await SupabaseData.getListItems(selectedList.id);
    setItems(refreshedItems);
    setShowItemModal(false);
    resetItemForm();
  };

  const resetItemForm = () => {
    setSelectedProductId('');
    setItemName('');
    setItemBarcode('');
    setItemQty('1');
    setItemPrice('0.00');
    setItemCategory('Mercearia');
    setItemStoreId('');
    setApiMessage(null);
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemName(prod.name);
      setItemCategory(prod.category);
      if (prod.barcode) setItemBarcode(prod.barcode);
    }
  };

  const lookupBarcodeInOpenFoodFacts = async (codeToLookup: string) => {
    if (!codeToLookup.trim()) return;

    setIsLoadingApi(true);
    setApiMessage({ text: 'Buscando dados na base Open Food Facts v3...', type: 'info' });

    // Check if product already exists locally/database first
    const existingProd = products.find((p) => p.barcode === codeToLookup.trim());
    if (existingProd) {
      setSelectedProductId(existingProd.id);
      setItemName(existingProd.name);
      setItemCategory(existingProd.category);
      setItemBarcode(existingProd.barcode || codeToLookup);
      setIsLoadingApi(false);
      setApiMessage({ text: 'Produto encontrado na sua base cadastrada!', type: 'success' });
      return;
    }

    // Otherwise, call Open Food Facts API v3
    const response = await fetchProductByBarcode(codeToLookup);
    setIsLoadingApi(false);

    if (response.success && response.product) {
      const p = response.product;
      const fullName = p.brands ? `${p.product_name} (${p.brands})` : (p.product_name || `Produto (${codeToLookup})`);
      setItemName(fullName);
      setItemBarcode(codeToLookup);

      // Auto-save new product to registry
      const newProd = await SupabaseData.saveProduct({
        barcode: codeToLookup,
        name: fullName,
        brand: p.brands || undefined,
        category: 'Mercearia',
        unit: 'un',
        image_url: p.image_front_url || p.image_front_small_url || undefined,
      });

      const refreshedProds = await SupabaseData.getProducts();
      setProducts(refreshedProds);
      setSelectedProductId(newProd.id);
      setApiMessage({ text: response.message, type: 'success' });
    } else {
      setItemBarcode(codeToLookup);
      setItemName(`Produto ${codeToLookup}`);
      setApiMessage({ text: response.message, type: 'error' });
    }
  };

  const handleScanBarcode = async (scannedCode: string) => {
    setShowScanner(false);
    setShowItemModal(true);
    await lookupBarcodeInOpenFoodFacts(scannedCode);
  };

  const toggleItemCheck = async (item: ShoppingListItem) => {
    await SupabaseData.saveListItem({
      ...item,
      is_checked: !item.is_checked,
    });

    const newItems = await SupabaseData.getListItems(item.list_id);
    setItems(newItems);

    // Celebrate if all items checked
    if (!item.is_checked && newItems.every((i) => i.is_checked)) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return;
    await SupabaseData.deleteListItem(itemId);
    const refreshedItems = await SupabaseData.getListItems(selectedList.id);
    setItems(refreshedItems);
  };

  const handleDeleteList = async (listId: string) => {
    await SupabaseData.deleteList(listId);
    const refreshedLists = await SupabaseData.getLists();
    setLists(refreshedLists);
    setSelectedList(null);
  };

  const getShareUrl = () => {
    if (!selectedList) return '';
    return `${window.location.origin}/list/${selectedList.share_token}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!selectedList) return;
    const text = `Confira e colabore na minha lista de compras "${selectedList.title}": ${getShareUrl()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const calculateTotals = () => {
    const totalEstimated = items.reduce((acc, item) => acc + item.quantity * item.estimated_price, 0);
    const totalActual = items.reduce((acc, item) => acc + (item.is_checked ? item.quantity * item.actual_price : 0), 0);
    const checkedCount = items.filter((i) => i.is_checked).length;
    return { totalEstimated, totalActual, checkedCount, totalCount: items.length };
  };

  const { totalEstimated, totalActual, checkedCount, totalCount } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* List Overview Screen */}
      {!selectedList ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Listas de Compras</h2>
              <p className="text-sm text-slate-500">
                Crie, compartilhe e gerencie suas listas de compras em tempo real.
              </p>
            </div>

            <button
              onClick={() => setShowNewListModal(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Lista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => {
              const listItems = items.filter((i) => i.list_id === list.id);
              const itemsCount = listItems.length;
              const completedCount = listItems.filter((i) => i.is_checked).length;
              const totalSpent = listItems
                .filter((i) => i.is_checked)
                .reduce((acc, item) => acc + item.quantity * item.actual_price, 0);

              return (
                <div
                  key={list.id}
                  onClick={() => setSelectedList(list)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-green-600 transition">
                        {list.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {list.description && <p className="text-xs text-slate-500 line-clamp-2">{list.description}</p>}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Progresso</span>
                      <span>
                        {completedCount} de {itemsCount} itens
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-600 h-full transition-all duration-300"
                        style={{ width: `${itemsCount > 0 ? (completedCount / itemsCount) * 100 : 0}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-500">Orçamento: R$ {Number(list.budget || 0).toFixed(2)}</span>
                      <span className="font-bold text-green-700">Gasto: R$ {totalSpent.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Selected List Detail Screen */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedList(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedList.title}</h2>
                <p className="text-xs text-slate-500">{selectedList.description || 'Lista compartilhada'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-3.5 py-2 rounded-xl text-xs transition"
              >
                <Scan className="w-4 h-4 text-green-400" />
                <span>Escanear Item</span>
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-xl text-xs transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
              </button>
              <button
                onClick={() => {
                  resetItemForm();
                  setShowItemModal(true);
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Item</span>
              </button>
            </div>
          </div>

          {/* Budget & Spent Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Orçamento da Lista</p>
                <p className="text-lg font-bold text-slate-800">R$ {Number(selectedList.budget || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Estimado</p>
                <p className="text-lg font-bold text-slate-800">R$ {totalEstimated.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Gasto no Carrinho</p>
                <p className="text-lg font-bold text-green-700">R$ {totalActual.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Itens da Lista ({checkedCount}/{totalCount} comprados)
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhum item adicionado ainda. Clique em "Adicionar Item" ou "Escanear Item".
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-center justify-between transition ${
                      item.is_checked ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleItemCheck(item)}
                        className={`p-1 rounded-lg transition ${
                          item.is_checked ? 'text-green-600' : 'text-slate-300 hover:text-slate-400'
                        }`}
                      >
                        {item.is_checked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </button>

                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            item.is_checked ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {item.product_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} x R$ {Number(item.actual_price || 0).toFixed(2)} | {item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`font-bold text-sm ${item.is_checked ? 'text-green-600' : 'text-slate-700'}`}>
                        R$ {(item.quantity * Number(item.actual_price || 0)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedList && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Compartilhar Lista</h3>
            <p className="text-xs text-slate-500">
              Qualquer pessoa com o link poderá visualizar e alterar a lista em tempo real.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Link de Acesso Direto
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600"
                  />
                  <button
                    onClick={copyShareLink}
                    className="p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs flex items-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar pelo WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal onScan={handleScanBarcode} onClose={() => setShowScanner(false)} />
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Criar Lista de Compras</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome da Lista</label>
                <input
                  type="text"
                  required
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  placeholder="Ex: Compras do Mês - Zaffari"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Orçamento Limite (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={listBudget}
                  onChange={(e) => setListBudget(e.target.value)}
                  placeholder="350.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descrição</label>
                <textarea
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  placeholder="Ex: Itens essenciais da feira e limpeza"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Adicionar Item à Lista</h3>

            {apiMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                  apiMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : apiMessage.type === 'error'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Buscar por Código de Barras / Open Food Facts
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={itemBarcode}
                      onChange={(e) => setItemBarcode(e.target.value)}
                      placeholder="Ex: 7891000100103"
                      className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <Scan className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingApi || !itemBarcode.trim()}
                    onClick={() => lookupBarcodeInOpenFoodFacts(itemBarcode)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 disabled:opacity-50"
                  >
                    {isLoadingApi ? (
                      <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                    ) : (
                      <span>Consultar v3</span>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Selecionar do Cadastro Existente
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                >
                  <option value="">Novo item sem cadastro</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand || 'Sem marca'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome do Item</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Leite Integral"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemModal(false);
                    resetItemForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
