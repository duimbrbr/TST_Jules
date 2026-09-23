import React, { useState } from 'react';
import { Product } from '../types';
import { LocalData } from '../lib/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Package, Plus, Scan, Search, ExternalLink, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(LocalData.getProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Modal and Scanner State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Mercearia');
  const [unit, setUnit] = useState('un');
  const [imageUrl, setImageUrl] = useState('');

  const categories = ['Todas', 'Laticínios', 'Mercearia', 'Padaria', 'Higiene', 'Limpeza', 'Hortifruti', 'Bebidas', 'Outros'];

  const handleScanBarcode = async (scannedCode: string) => {
    setShowScanner(false);
    setBarcode(scannedCode);
    setShowProductModal(true);

    // Try auto-lookup on Open Food Facts API
    setIsLoadingApi(true);
    setApiMessage('Buscando dados do produto na base pública Open Food Facts...');
    try {
      const res = await fetch(`https://br.openfoodfacts.org/api/v2/product/${scannedCode}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          if (p.product_name) setName(p.product_name);
          if (p.brands) setBrand(p.brands);
          if (p.image_front_url) setImageUrl(p.image_front_url);
          setApiMessage('Dados do produto preenchidos automaticamente com sucesso!');
        } else {
          setApiMessage('Código de barras lido. Preencha os detalhes do produto.');
        }
      }
    } catch (e) {
      setApiMessage('Não foi possível conectar à base pública. Preencha manualmente.');
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    LocalData.saveProduct({
      name,
      brand: brand || undefined,
      barcode: barcode || undefined,
      category,
      unit,
      image_url: imageUrl || undefined,
    });

    setProducts(LocalData.getProducts());
    setShowProductModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setBarcode('');
    setCategory('Mercearia');
    setUnit('un');
    setImageUrl('');
    setApiMessage(null);
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
          <p className="text-sm text-slate-500">Cadastre e gerencie os produtos da sua despensa e das suas listas.</p>
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
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
          >
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                  <Package className="w-8 h-8 stroke-1" />
                  <span className="text-xs">Sem foto</span>
                </div>
              )}
              <span className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {p.category}
              </span>
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
        ))}
      </div>

      {/* Product Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScanBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800">Cadastrar Produto</h3>

            {apiMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
                <span>{apiMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Código de Barras</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="789..."
                      className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <Scan className="w-4 h-4" />
                    </button>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  URL Direta da Foto
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-produto.jpg"
                    className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Insira um link direto de imagem na web para economizar espaço no banco.</p>
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50 flex items-center justify-center">
                  <img src={imageUrl} alt="Pré-visualização" className="h-full object-cover" />
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
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
