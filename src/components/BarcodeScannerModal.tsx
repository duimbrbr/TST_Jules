import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'barcode-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(console.error);
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignore normal scan frame errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl relative flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-green-700 font-bold text-lg mb-4">
          <Camera className="w-5 h-5" />
          <span>Escanear Código de Barras / QR Code</span>
        </div>

        <div id="barcode-reader" className="w-full rounded-xl overflow-hidden border border-slate-200"></div>

        <p className="text-xs text-slate-500 mt-3 text-center">
          Aponte a câmera do seu celular ou computador para o código de barras do produto ou QR Code da Nota Fiscal (NFC-e).
        </p>
      </div>
    </div>
  );
};
