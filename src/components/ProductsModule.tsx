import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { SupabaseData } from '../lib/supabaseData';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { fetchProductByBarcode } from '../services/openFoodFactsService';
import {
  Package, Plus, Scan, Search, Image as ImageIcon,
  CheckCircle2, AlertCircle, Loader2, Edit2, Trash2
} from 'lucide-react';

export const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Modal and Scanner State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Mercearia');
  const [unit, setUnit] = useState('un');
  const [imageUrl, setImageUrl] = useState('');

  // Image load error state tracker for fallback rendering
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const categories = ['Todas', 'Laticínios', 'Mercearia', 'Padaria', 'Higiene', 'Limpeza', 'Hortifruti', 'Bebidas', 'Outros'];

  const loadProducts = async () => {
    const fetched = await SupabaseData.getProducts();
    setProducts(fetched);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const lookupBarcode = async (codeToLookup: string) => {
    if (!codeToLookup.trim()) return;

    setIsLoadingApi(true);
    setApiMessage({ text: 'Buscando na base pública Open Food Facts v3...', type: 'info' });

    const response = await fetchProductByBarcode(codeToLookup);
    setIsLoadingApi(false);

    if (response.success && response.product) {
      const p = response.product;
      if (p.product_name) setName(p.product_name);
      if (p.brands) setBrand(p.brands);
      if (p.image_front_url || p.image_front_small_url) {
        setImageUrl(p.image_front_url || p.image_front_small_url || '');
      }
      setApiMessage({ text: response.message, type: 'success' });
    } else {
      setApiMessage({ text: response.message, type: 'error' });
    }
  };

  const handleScanBarcode = async (scannedCode: string) => {
    setShowScanner(false);
    setBarcode(scannedCode);
    setShowProductModal(true);

    await lookupBarcode(scannedCode);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setBrand(prod.brand || '');
    setBarcode(prod.barcode || '');
    setCategory(prod.category || 'Mercearia');
    setUnit(prod.unit || 'un');
    setImageUrl(prod.image_url || '');
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${prodName}"?`)) {
      await SupabaseData.deleteProduct(id);
      await loadProducts();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await SupabaseData.saveProduct({
      id: editingProductId || undefined,
      name,
      brand: brand || undefined,
      barcode: barcode || undefined,
      category,
      unit,
      image_url: imageUrl || undefined,
    });

    await loadProducts();
    setShowProductModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setBrand('');
    setBarcode('');
    setCategory('Mercearia');
    setUnit('un');
    setImageUrl('');
    setApiMessage(null);
  };

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm));

    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Produtos</h2>
          <p className="text-sm text-slate-500">
            Cadastre e gerencie os produtos da sua despensa com integração Open Food Facts v3.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Scan className="w-5 h-5 text-green-400" />
            <span>Escanear Código</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowProductModal(true);
            }}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, marca ou código de barras..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => {
          const hasFailedImage = failedImageIds.has(p.id);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                {p.image_url && !hasFailedImage ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    onError={() => handleImageError(p.id)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <Package className="w-8 h-8 stroke-1" />
                    <span className="text-[11px]">Sem foto ou indisponível</span>
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {p.category}
                </span>

                <div className="absolute top-2 left-2 flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEditProduct(p)}
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm"
                    title="Editar Produto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="p-1.5 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm"
                    title="Excluir Produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</h3>
                  {p.brand && <p className="text-xs text-slate-500 font-medium">{p.brand}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Unidade: <strong className="text-slate-700">{p.unit}</strong></span>
                  {p.barcode && (
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {p.barcode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScanBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800">
              {editingProductId ? 'Editar Produto' : 'Cadastrar Produto'}
            </h3>

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
                {apiMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                )}
                <span>{apiMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Código de Barras (EAN)</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
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
                    disabled={isLoadingApi || !barcode.trim()}
                    onClick={() => lookupBarcode(barcode)}
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Leite Integral 1L"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Elegê"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="Mercearia">Mercearia</option>
                    <option value="Laticínios">Laticínios</option>
                    <option value="Padaria">Padaria</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Unidade Medida</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  URL Direta da Foto (image_front_url)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.openfoodfacts.org/..."
                    className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Pré-visualização"
                    onError={() => setImageUrl('')}
                    className="h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  {editingProductId ? 'Salvar Alterações' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
