export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  nutriments?: Record<string, unknown>;
}

export interface OpenFoodFactsResponse {
  success: boolean;
  product?: OpenFoodFactsProduct;
  message: string;
}

type ProductLookupResult =
  | { status: 'found'; product: OpenFoodFactsProduct }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

const PRODUCT_FIELDS = 'code,product_name,brands,nutriments,nutriscore_grade,nova_group,ingredients_text,image_front_url,image_front_small_url';
const PRODUCT_SOURCES = [
  { name: 'base brasileira', baseUrl: 'https://br.openfoodfacts.org/api/v3.6/product' },
  { name: 'base mundial', baseUrl: 'https://world.openfoodfacts.org/api/v3.6/product' },
] as const;

const toProduct = (product: Record<string, unknown>, barcode: string): OpenFoodFactsProduct => ({
  code: typeof product.code === 'string' ? product.code : barcode,
  product_name: typeof product.product_name === 'string' ? product.product_name : '',
  brands: typeof product.brands === 'string' ? product.brands : '',
  image_front_url: typeof product.image_front_url === 'string' ? product.image_front_url : '',
  image_front_small_url: typeof product.image_front_small_url === 'string' ? product.image_front_small_url : '',
  ingredients_text: typeof product.ingredients_text === 'string' ? product.ingredients_text : '',
  nutriscore_grade: typeof product.nutriscore_grade === 'string' ? product.nutriscore_grade : '',
  nova_group: typeof product.nova_group === 'number' ? product.nova_group : undefined,
  nutriments: typeof product.nutriments === 'object' && product.nutriments !== null ? product.nutriments as Record<string, unknown> : {},
});

const lookupSource = async (barcode: string, baseUrl: string): Promise<ProductLookupResult> => {
  const queryParams = new URLSearchParams({ fields: PRODUCT_FIELDS, lc: 'pt' });
  const url = `${baseUrl}/${encodeURIComponent(barcode)}.json?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return { status: 'not_found' };
    if (!response.ok) return { status: 'error', message: `Status ${response.status}` };

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return { status: 'not_found' };

    const responseData = data as { product?: unknown; data?: { product?: unknown } };
    const product = responseData.product || responseData.data?.product;
    if (!product || typeof product !== 'object') return { status: 'not_found' };

    return { status: 'found', product: toProduct(product as Record<string, unknown>, barcode) };
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return { status: 'error', message: 'falha de conexão' };
  }
};

export const fetchProductByBarcode = async (barcode: string): Promise<OpenFoodFactsResponse> => {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return { success: false, message: 'Código de barras inválido.' };

  const brazilResult = await lookupSource(cleanBarcode, PRODUCT_SOURCES[0].baseUrl);
  if (brazilResult.status === 'found') {
    return { success: true, product: brazilResult.product, message: 'Produto encontrado na base brasileira do Open Food Facts.' };
  }

  const worldResult = await lookupSource(cleanBarcode, PRODUCT_SOURCES[1].baseUrl);
  if (worldResult.status === 'found') {
    return { success: true, product: worldResult.product, message: 'Produto encontrado na base mundial do Open Food Facts.' };
  }

  if (brazilResult.status === 'error' && worldResult.status === 'error') {
    return { success: false, message: `Não foi possível consultar o Open Food Facts (${brazilResult.message}; ${worldResult.message}).` };
  }

  return { success: false, message: 'Produto não cadastrado nas bases brasileira ou mundial do Open Food Facts.' };
};
