export interface SefazReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SefazReceiptLookup {
  state: 'SP' | 'RJ';
  items: SefazReceiptItem[];
  totalAmount: number;
}

export const consultSefazReceipt = async (qrCodeUrl: string): Promise<SefazReceiptLookup> => {
  return requestSefazReceipt('url', qrCodeUrl);
};

export const consultSefazReceiptByKey = async (accessKey: string): Promise<SefazReceiptLookup> => {
  return requestSefazReceipt('key', accessKey);
};

const requestSefazReceipt = async (parameter: 'url' | 'key', value: string): Promise<SefazReceiptLookup> => {
  const response = await fetch(`/api/sefaz?${parameter}=${encodeURIComponent(value)}`);
  const payload: unknown = await response.json();
  const data = payload as Partial<SefazReceiptLookup> & { message?: string };

  if (!response.ok || !data.state || !data.items || typeof data.totalAmount !== 'number') {
    throw new Error(data.message || 'Não foi possível consultar a NFC-e na SEFAZ.');
  }

  return data as SefazReceiptLookup;
};
