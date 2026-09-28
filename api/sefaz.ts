type ReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

const SUPPORTED_HOSTS = new Set([
  'www.nfce.fazenda.sp.gov.br',
  'www4.fazenda.rj.gov.br',
]);

const decodeHtml = (value: string) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCharCode(parseInt(hex || decimal, hex ? 16 : 10)));

const textOnly = (value: string) => decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const parseNumber = (value: string) => Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));

const parseItems = (html: string): ReceiptItem[] => {
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

  return rows.flatMap((row) => {
    const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textOnly(cell[1]));
    if (cells.length < 3 || /descri[çc][ãa]o|produto|quantidade|valor unit/i.test(cells.join(' '))) return [];

    const name = cells.find((cell) => /[a-záéíóúãõç]/i.test(cell) && !/^\d+[,.]?\d*$/.test(cell));
    const numbers = cells.map(parseNumber).filter((value) => Number.isFinite(value) && value > 0);
    if (!name || numbers.length < 2) return [];

    const quantity = numbers[0];
    const unitPrice = numbers[numbers.length - 2];
    const totalPrice = numbers[numbers.length - 1];
    return [{ product_name: name, quantity, unit_price: unitPrice, total_price: totalPrice }];
  });
};

const extractTotal = (html: string) => {
  const match = html.match(/(?:valor\s*(?:a\s*)?pagar|valor\s*total|total\s*(?:da\s*)?nota)[^\d]{0,120}(?:R\$\s*)?([\d.]+,\d{2})/i);
  return match ? parseNumber(match[1]) : undefined;
};

export default async function handler(req: { method?: string; query: { url?: string | string[] } }, res: { status: (status: number) => { json: (body: unknown) => void } }) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido.' });

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!rawUrl) return res.status(400).json({ message: 'Informe a URL do QR Code da NFC-e.' });

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ message: 'URL da NFC-e inválida.' });
  }

  if (url.protocol !== 'https:' || !SUPPORTED_HOSTS.has(url.hostname)) {
    return res.status(400).json({ message: 'No momento, somente QR Codes oficiais de NFC-e de SP e RJ são aceitos.' });
  }

  const state = url.hostname === 'www.nfce.fazenda.sp.gov.br' ? 'SP' : 'RJ';
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'MercadoLista/1.0 NFC-e consultation',
      },
    });
    if (!response.ok) return res.status(502).json({ message: `A SEFAZ-${state} respondeu com status ${response.status}.` });

    const html = await response.text();
    if (/captcha|acesso negado|não autorizado|access denied/i.test(html)) {
      return res.status(502).json({ message: `A consulta da SEFAZ-${state} exige validação no portal oficial. Abra o QR Code no navegador para concluir a verificação.` });
    }

    const items = parseItems(html);
    const totalAmount = extractTotal(html) ?? items.reduce((total, item) => total + item.total_price, 0);
    if (!items.length) {
      return res.status(422).json({ message: `A SEFAZ-${state} não disponibilizou itens legíveis para esta nota. Confira os dados no portal oficial e preencha-os manualmente.` });
    }

    return res.status(200).json({ state, items, totalAmount });
  } catch (error) {
    console.error('SEFAZ consultation failed:', error);
    return res.status(502).json({ message: `Não foi possível consultar a SEFAZ-${state}. Tente novamente mais tarde.` });
  }
}
