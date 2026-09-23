import React, { useState } from 'react';
import { Receipt, ReceiptItem, Store } from '../types';
import { LocalData } from '../lib/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { FileText, QrCode, Scan, Plus, CheckCircle2, AlertCircle, ExternalLink, Calendar, Store as StoreIcon } from 'lucide-react';

export const ReceiptsModule: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>(LocalData.getReceipts());
  const [stores] = useState<Store[]>(LocalData.getStores());

  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [scannedUrl, setScannedUrl] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Manual Receipt State
  const [storeId, setStoreId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [itemsText, setItemsText] = useState('');

  const parseSefazUrl = (url: string) => {
    // Simulated parser for SEFAZ RS NFC-e QR Code URLs
    setScannedUrl(url);

    // Extract access key from standard NFC-e URL parameter p=
    let extractedKey = '';
    const match = url.match(/p=([0-9]{44})/);
    if (match) {
      extractedKey = match[1];
    } else if (url.length === 44 && /^\d+$/.test(url)) {
      extractedKey = url;
    } else {
      extractedKey = `43240${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;
    }

    // Pick store from list or create RS store
    const store = stores[0] || { id: 'store-1', name: 'Zaffari Ipiranga', network_id: 'net-1', network_name: 'Rede Zaffari' };

    // Auto-extracted items simulation for SEFAZ RS
    const extractedItems: ReceiptItem[] = [
      { id: `ri-${Date.now()}-1`, product_name: 'Leite Integral 1L', barcode: '7891000100103', quantity: 3, unit_price: 4.89, total_price: 14.67 },
      { id: `ri-${Date.now()}-2`, product_name: 'Café Torrado e Moído 500g', barcode: '7891000241011', quantity: 1, unit_price: 19.90, total_price: 19.90 },
      { id: `ri-${Date.now()}-3`, product_name: 'Pão de Forma Tradicional 500g', barcode: '7891000300015', quantity: 1, unit_price: 8.90, total_price: 8.90 },
    ];

    const total = extractedItems.reduce((acc, i) => acc + i.total_price, 0);

    const user = LocalData.getUser();
    const newReceipt = LocalData.saveReceipt({
      user_id: user?.id || 'usr-demo',
      store_id: store.id,
      store_name: store.name,
      network_id: store.network_id,
      network_name: store.network_name,
      access_key: extractedKey,
      url: url,
      total_amount: total,
      issue_date: new Date().toISOString(),
      state: 'RS',
      items: extractedItems,
    });

    setReceipts(LocalData.getReceipts());
    setSelectedReceipt(newReceipt);
  };

  const handleScanNFCe = (scannedCode: string) => {
    setShowScanner(false);
    parseSefazUrl(scannedCode);
  };

  const handleManualReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalAmount) return;

    const store = stores.find((s) => s.id === storeId) || stores[0];

    // Parse items line by line (Ex: "Leite Integral | 2 | 4.89")
    const lines = itemsText.split('\n').filter((l) => l.trim());
    const parsedItems: ReceiptItem[] = lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      const pName = parts[0] || `Item ${idx + 1}`;
      const qty = parseFloat(parts[1]) || 1;
      const unitPrice = parseFloat(parts[2]) || 5.0;

      return {
        id: `ri-${Date.now()}-${idx}`,
        product_name: pName,
        quantity: qty,
        unit_price: unitPrice,
        total_price: qty * unitPrice,
      };
    });

    const user = LocalData.getUser();
    const newReceipt = LocalData.saveReceipt({
      user_id: user?.id || 'usr-demo',
      store_id: store?.id,
      store_name: store?.name || 'Mercado Local',
      network_id: store?.network_id,
      network_name: store?.network_name,
      access_key: accessKey || `43240${Math.floor(Math.random() * 100000000000000)}`,
      total_amount: parseFloat(totalAmount),
      issue_date: new Date().toISOString(),
      state: 'RS',
      items: parsedItems.length > 0 ? parsedItems : [
        { id: `ri-${Date.now()}-1`, product_name: 'Gêneros Alimentícios', quantity: 1, unit_price: parseFloat(totalAmount), total_price: parseFloat(totalAmount) }
      ],
    });

    setReceipts(LocalData.getReceipts());
    setShowManualModal(false);
    setTotalAmount('');
    setItemsText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notas Fiscais (NFC-e RS)</h2>
          <p className="text-sm text-slate-500">
            Escaneie o QR Code da nota fiscal do mercado para coletar os produtos e preços da SEFAZ.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <QrCode className="w-5 h-5" />
            <span>Escanear QR Code Nota</span>
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            <span>Digitar Nota</span>
          </button>
        </div>
      </div>

      {/* Receipts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.map((rcpt) => (
          <div
            key={rcpt.id}
            onClick={() => setSelectedReceipt(rcpt)}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-slate-800 text-base">{rcpt.store_name || 'Mercado'}</h3>
                <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  R$ {rcpt.total_amount.toFixed(2)}
                </span>
              </div>
              {rcpt.network_name && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">{rcpt.network_name}</p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(rcpt.issue_date).toLocaleDateString('pt-BR')}</span>
                </span>
                <span className="font-semibold text-slate-600">{rcpt.items?.length || 0} itens</span>
              </div>

              {rcpt.access_key && (
                <p className="font-mono text-[10px] text-slate-400 truncate">
                  Chave: {rcpt.access_key}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedReceipt.store_name}</h3>
                <p className="text-xs text-slate-500">
                  Emitida em {new Date(selectedReceipt.issue_date).toLocaleString('pt-BR')} (SEFAZ-{selectedReceipt.state})
                </p>
              </div>
              <span className="text-lg font-bold text-green-700 bg-green-50 px-3 py-1 rounded-xl">
                R$ {selectedReceipt.total_amount.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">Itens da Nota Fiscal</h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                {selectedReceipt.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{item.product_name}</p>
                      <p className="text-slate-400 text-[11px]">
                        {item.quantity}x R$ {item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-700">R$ {item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
              >
                Fechar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode / QR Code Scanner */}
      {showScanner && (
        <BarcodeScannerModal onScan={handleScanNFCe} onClose={() => setShowScanner(false)} />
      )}

      {/* Manual Receipt Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Lançamento Manual de Nota Fiscal</h3>

            <form onSubmit={handleManualReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Loja</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="150.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Chave de Acesso (Opcional)</label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="432409..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Itens da Nota (Linha por Linha: Nome | Qtd | Preço)
                </label>
                <textarea
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="Leite Integral | 2 | 4.89&#10;Café Torrado | 1 | 18.50"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs h-28 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
