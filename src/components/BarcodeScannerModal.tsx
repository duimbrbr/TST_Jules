import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isScanning = false;
    const elementId = 'barcode-scanner-video-container';

    // Clear any previous container content to prevent leftover video elements
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = '';
    }

    const html5Qrcode = new Html5Qrcode(elementId);
    html5QrcodeRef.current = html5Qrcode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 180 },
      aspectRatio: 1.0,
    };

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (isMounted && isScanning) {
            isScanning = false;
            html5Qrcode
              .stop()
              .then(() => {
                html5Qrcode.clear();
                onScan(decodedText);
              })
              .catch((err) => {
                console.error('Error stopping scanner on scan:', err);
                onScan(decodedText);
              });
          }
        },
        () => {
          // Ignore frame decode errors
        }
      )
      .then(() => {
        if (!isMounted) {
          // Component unmounted while camera start was in-flight
          html5Qrcode
            .stop()
            .then(() => html5Qrcode.clear())
            .catch(console.error);
        } else {
          isScanning = true;
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error starting camera scanner:', err);
          setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
        }
      });

    return () => {
      isMounted = false;
      if (isScanning) {
        isScanning = false;
        html5Qrcode
          .stop()
          .then(() => html5Qrcode.clear())
          .catch(console.error);
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current
        .stop()
        .then(() => {
          html5QrcodeRef.current?.clear();
          onClose();
        })
        .catch(() => {
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl relative flex flex-col items-center">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-green-700 font-bold text-lg mb-4">
          <Camera className="w-5 h-5" />
          <span>Escanear Código de Barras / QR Code</span>
        </div>

        {errorMessage ? (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-center">
            {errorMessage}
          </div>
        ) : (
          <div
            id="barcode-scanner-video-container"
            className="w-full rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-900"
          ></div>
        )}

        <p className="text-xs text-slate-500 mt-3 text-center">
          Aponte a câmera do seu celular ou computador para o código de barras do produto ou QR Code da Nota Fiscal (NFC-e).
        </p>
      </div>
    </div>
  );
};
