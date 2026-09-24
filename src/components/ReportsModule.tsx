import React, { useState, useEffect } from 'react';
import { SupabaseData } from '../lib/supabaseData';
import { Receipt, ShoppingList, Store, Product } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Store as StoreIcon, Building2, Tag, ArrowUpDown, Award } from 'lucide-react';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#4f46e5'];

export const ReportsModule: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadData = async () => {
    const fetchedReceipts = await SupabaseData.getReceipts();
    const fetchedLists = await SupabaseData.getLists();
    const fetchedStores = await SupabaseData.getStores();
    const fetchedProducts = await SupabaseData.getProducts();

    setReceipts(fetchedReceipts);
    setLists(fetchedLists);
    setStores(fetchedStores);
    setProducts(fetchedProducts);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Comparison of Product Prices across Stores
  const getProductPriceComparison = () => {
    const productMap: { [productName: string]: { [storeName: string]: number } } = {};

    receipts.forEach((rcpt) => {
      const sName = rcpt.store_name || 'Mercado';
      rcpt.items?.forEach((item) => {
        if (!productMap[item.product_name]) {
          productMap[item.product_name] = {};
        }
        productMap[item.product_name][sName] = item.unit_price;
      });
    });

    return Object.entries(productMap).map(([pName, storePrices]) => ({
      product_name: pName,
      ...storePrices,
    }));
  };

  // 2. Expense by Category
  const getCategoryExpenses = () => {
    const catMap: { [cat: string]: number } = {};

    receipts.forEach((rcpt) => {
      rcpt.items?.forEach((item) => {
        const prod = products.find((p) => p.name.toLowerCase() === item.product_name.toLowerCase());
        const cat = prod?.category || 'Geral';
        catMap[cat] = (catMap[cat] || 0) + item.total_price;
      });
    });

    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };

  // 3. Expense by Store
  const getStoreExpenses = () => {
    const storeMap: { [sName: string]: number } = {};

    receipts.forEach((rcpt) => {
      const sName = rcpt.store_name || 'Desconhecido';
      storeMap[sName] = (storeMap[sName] || 0) + rcpt.total_amount;
    });

    return Object.entries(storeMap).map(([name, total]) => ({ name, total }));
  };

  // 4. Expense by Store Network
  const getNetworkExpenses = () => {
    const netMap: { [netName: string]: number } = {};

    receipts.forEach((rcpt) => {
      const netName = rcpt.network_name || 'Lojas Independentes';
      netMap[netName] = (netMap[netName] || 0) + rcpt.total_amount;
    });

    return Object.entries(netMap).map(([name, total]) => ({ name, total }));
  };

  // 5. Historical Price Trends
  const getPriceHistory = () => {
    const dates: { [dateStr: string]: { [prodName: string]: number } } = {};

    receipts.forEach((rcpt) => {
      const d = new Date(rcpt.issue_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dates[d]) dates[d] = {};

      rcpt.items?.forEach((item) => {
        dates[d][item.product_name] = item.unit_price;
      });
    });

    return Object.entries(dates).map(([date, items]) => ({
      date,
      ...items,
    }));
  };

  const productComparisonData = getProductPriceComparison();
  const categoryData = getCategoryExpenses();
  const storeData = getStoreExpenses();
  const networkData = getNetworkExpenses();
  const priceHistoryData = getPriceHistory();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Controle e Comparação de Gastos</h2>
        <p className="text-sm text-slate-500">
          Acompanhe relatórios detalhados de preços por produto, gastos por loja, categoria e rede.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Geral de Notas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              R$ {receipts.reduce((acc, r) => acc + Number(r.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Lojas Comparadas</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{storeData.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <StoreIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Redes de Lojas</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{networkData.length}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Categorias</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{categoryData.length}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart 1: Expense by Store Network & Specific Store */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-green-600" />
            <span>Gasto por Rede de Loja</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={networkData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                <Bar dataKey="total" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <StoreIcon className="w-5 h-5 text-blue-600" />
            <span>Gasto por Loja Específica</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: Category Distribution & Price Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>Gasto por Categoria de Produto</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
            <ArrowUpDown className="w-5 h-5 text-purple-600" />
            <span>Histórico de Variação de Preços</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistoryData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Leite Integral 1L" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="Café Torrado e Moído 500g" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Price Comparison Table across Stores */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
          <Award className="w-5 h-5 text-green-600" />
          <span>Tabela Comparativa de Preço do Mesmo Produto entre Lojas</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Zaffari Ipiranga</th>
                <th className="p-3">Carrefour Passo d'Areia</th>
                <th className="p-3">Melhor Opção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {productComparisonData.map((row: any, idx: number) => {
                const zaffariPrice = row['Zaffari Ipiranga'] || 0;
                const carrefourPrice = row['Carrefour Passo d\'Areia'] || 0;
                let bestStore = 'Preço similar';

                if (zaffariPrice && carrefourPrice) {
                  if (zaffariPrice < carrefourPrice) bestStore = 'Zaffari Ipiranga (Mais Barato)';
                  else if (carrefourPrice < zaffariPrice) bestStore = 'Carrefour (Mais Barato)';
                } else if (zaffariPrice) {
                  bestStore = 'Apenas no Zaffari';
                } else if (carrefourPrice) {
                  bestStore = 'Apenas no Carrefour';
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{row.product_name}</td>
                    <td className="p-3">{zaffariPrice ? `R$ ${zaffariPrice.toFixed(2)}` : '-'}</td>
                    <td className="p-3">{carrefourPrice ? `R$ ${carrefourPrice.toFixed(2)}` : '-'}</td>
                    <td className="p-3 font-bold text-green-700">{bestStore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
