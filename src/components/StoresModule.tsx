import React, { useState } from 'react';
import { Store, StoreNetwork } from '../types';
import { LocalData } from '../lib/storage';
import { Store as StoreIcon, Building2, Plus, MapPin, Tag } from 'lucide-react';

export const StoresModule: React.FC = () => {
  const [stores, setStores] = useState<Store[]>(LocalData.getStores());
  const [networks, setNetworks] = useState<StoreNetwork[]>(LocalData.getNetworks());
  const [activeTab, setActiveTab] = useState<'stores' | 'networks'>('stores');

  // Store Form State
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('Supermercado');
  const [networkId, setNetworkId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('RS');

  // Network Form State
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [networkDesc, setNetworkDesc] = useState('');

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    const saved = LocalData.saveStore({
      name: storeName,
      store_type: storeType,
      network_id: networkId || undefined,
      address,
      city,
      state,
    });

    setStores(LocalData.getStores());
    setShowStoreModal(false);
    setStoreName('');
    setAddress('');
    setCity('');
  };

  const handleSaveNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!networkName.trim()) return;

    const saved = LocalData.saveNetwork({
      name: networkName,
      description: networkDesc,
    });

    setNetworks(LocalData.getNetworks());
    setShowNetworkModal(false);
    setNetworkName('');
    setNetworkDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lojas e Redes</h2>
          <p className="text-sm text-slate-500">Gerencie os mercados, farmácias, padarias e redes onde você realiza compras.</p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'stores' ? (
            <button
              onClick={() => setShowStoreModal(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Loja</span>
            </button>
          ) : (
            <button
              onClick={() => setShowNetworkModal(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Rede</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-medium text-sm transition ${
            activeTab === 'stores'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>Lojas Cadastradas ({stores.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('networks')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-medium text-sm transition ${
            activeTab === 'networks'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Redes de Lojas ({networks.length})</span>
        </button>
      </div>

      {/* Stores Tab Grid */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                  <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200">
                    {s.store_type}
                  </span>
                </div>
                {s.network_name && (
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rede: {s.network_name}</span>
                  </p>
                )}
              </div>

              {(s.address || s.city) && (
                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 flex items-start space-x-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {s.address ? `${s.address}, ` : ''}
                    {s.city ? `${s.city} - ` : ''}
                    {s.state}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Networks Tab Grid */}
      {activeTab === 'networks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((n) => {
            const count = stores.filter((s) => s.network_id === n.id).length;
            return (
              <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-green-600" />
                    <span>{n.name}</span>
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {count} {count === 1 ? 'Loja' : 'Lojas'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{n.description || 'Sem descrição cadastrada.'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Cadastrar Nova Loja</h3>
            <form onSubmit={handleSaveStore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome da Loja</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Zaffari Ipiranga"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Estabelecimento</label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="Supermercado">Supermercado</option>
                    <option value="Hipermercado">Hipermercado</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Padaria">Padaria</option>
                    <option value="Açougue">Açougue</option>
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Conveniência">Conveniência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Rede (Opcional)</label>
                  <select
                    value={networkId}
                    onChange={(e) => setNetworkId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="">Nenhuma</option>
                    {networks.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Endereço</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Ipiranga, 5200"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Porto Alegre"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm uppercase text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Network Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Cadastrar Rede de Lojas</h3>
            <form onSubmit={handleSaveNetwork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome da Rede</label>
                <input
                  type="text"
                  required
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  placeholder="Ex: Rede Zaffari"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descrição</label>
                <textarea
                  value={networkDesc}
                  onChange={(e) => setNetworkDesc(e.target.value)}
                  placeholder="Ex: Grupo de supermercados e hipermercados..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNetworkModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  Salvar Rede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
