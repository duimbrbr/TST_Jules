type ReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

const SUPPORTED_HOSTS = new Set([
  'www.nfce.fazenda.sp.gov.br',
  'www.fazenda.rj.gov.br',
  'www4.fazenda.rj.gov.br',
]);

const STATE_BY_KEY_PREFIX: Record<string, 'SP' | 'RJ'> = { '35': 'SP', '33': 'RJ' };
const KEY_CONSULTATION_URL: Record<'SP' | 'RJ', string> = {
  SP: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaPublica.aspx',
  RJ: 'https://www.fazenda.rj.gov.br/nfce/consulta',
};

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

const inputAttributes = (tag: string) => Object.fromEntries([...tag.matchAll(/([\w$-]+)=["']([^"']*)["']/g)].map(([, key, value]) => [key.toLowerCase(), decodeHtml(value)]));

const consultByKey = async (key: string, state: 'SP' | 'RJ') => {
  const consultationUrl = KEY_CONSULTATION_URL[state];
  const initialResponse = await fetch(consultationUrl, { headers: { Accept: 'text/html,application/xhtml+xml' } });
  if (!initialResponse.ok) throw new Error(`A página de consulta da SEFAZ-${state} respondeu com status ${initialResponse.status}.`);

  const initialHtml = await initialResponse.text();
  const fields = new URLSearchParams();
  for (const tag of initialHtml.match(/<input\b[^>]*>/gi) ?? []) {
    const attributes = inputAttributes(tag);
    if (attributes.name && attributes.type === 'hidden') fields.set(attributes.name, attributes.value || '');
  }

  const keyField = (initialHtml.match(/<input\b[^>]*(?:name|id)=["'][^"']*(?:chave|acesso|chnfe)[^"']*["'][^>]*>/i) ?? []).map(inputAttributes)[0];
  if (!keyField?.name) throw new Error(`A SEFAZ-${state} não disponibilizou o formulário de consulta por chave.`);
  fields.set(keyField.name, key);

  const submitField = (initialHtml.match(/<input\b[^>]*type=["']submit["'][^>]*>/i) ?? []).map(inputAttributes)[0];
  if (submitField?.name) fields.set(submitField.name, submitField.value || 'Consultar');

  const response = await fetch(consultationUrl, {
    method: 'POST',
    headers: { Accept: 'text/html,application/xhtml+xml', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fields.toString(),
  });
  if (!response.ok) throw new Error(`A SEFAZ-${state} respondeu com status ${response.status}.`);
  return { html: await response.text(), state };
};

export default async function handler(req: { method?: string; query: { url?: string | string[]; key?: string | string[] } }, res: { status: (status: number) => { json: (body: unknown) => void } }) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido.' });

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const rawKey = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
  if (!rawUrl && !rawKey) return res.status(400).json({ message: 'Informe a URL do QR Code ou a chave de acesso da NFC-e.' });

  if (rawKey) {
    const key = rawKey.replace(/\D/g, '');
    const state = STATE_BY_KEY_PREFIX[key.slice(0, 2)];
    if (key.length !== 44 || !state) return res.status(400).json({ message: 'Informe uma chave de 44 dígitos de uma NFC-e de SP ou RJ.' });

    try {
      const { html } = await consultByKey(key, state);
      if (/captcha|acesso negado|não autorizado|access denied/i.test(html)) {
        return res.status(502).json({ message: `A consulta por chave da SEFAZ-${state} exige validação no portal oficial.` });
      }
      const items = parseItems(html);
      const totalAmount = extractTotal(html) ?? items.reduce((total, item) => total + item.total_price, 0);
      if (!items.length) return res.status(422).json({ message: `A SEFAZ-${state} não disponibilizou itens legíveis para esta chave. Confira os dados no portal oficial e preencha-os manualmente.` });
      return res.status(200).json({ state, items, totalAmount });
    } catch (error) {
      const message = error instanceof Error ? error.message : `Não foi possível consultar a SEFAZ-${state}.`;
      console.error('SEFAZ key consultation failed:', error);
      return res.status(502).json({ message });
    }
  }

  let url: URL;
  try {
    url = new URL(rawUrl!);
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
