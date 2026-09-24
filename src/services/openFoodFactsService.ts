export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  nutriments?: Record<string, any>;
}

export interface OpenFoodFactsResponse {
  success: boolean;
  product?: OpenFoodFactsProduct;
  message: string;
}

const BASE_URL = 'https://br.openfoodfacts.org/api/v3/product';

export const fetchProductByBarcode = async (barcode: string): Promise<OpenFoodFactsResponse> => {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) {
    return { success: false, message: 'Código de barras inválido.' };
  }

  const queryParams = new URLSearchParams({
    fields: 'code,product_name,brands,nutriments,nutriscore_grade,nova_group,ingredients_text,image_front_url,image_front_small_url',
    lc: 'pt'
  });

  const url = `${BASE_URL}/${encodeURIComponent(cleanBarcode)}.json?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MercadoListaApp/1.0 (contato@mercadolista.app)',
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return {
        success: false,
        message: 'Produto não cadastrado na base de dados (Open Food Facts).'
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Erro no servidor Open Food Facts (Status ${response.status}).`
      };
    }

    const data = await response.json();

    // Support v3 response format: response.product or response.data.product
    const productData = data.product || (data.data && data.data.product);

    if (productData) {
      return {
        success: true,
        product: {
          code: productData.code || cleanBarcode,
          product_name: productData.product_name || '',
          brands: productData.brands || '',
          image_front_url: productData.image_front_url || productData.image_front_small_url || '',
          image_front_small_url: productData.image_front_small_url || productData.image_front_url || '',
          ingredients_text: productData.ingredients_text || '',
          nutriscore_grade: productData.nutriscore_grade || '',
          nova_group: productData.nova_group,
          nutriments: productData.nutriments || {}
        },
        message: 'Produto encontrado na base de dados Open Food Facts!'
      };
    }

    return {
      success: false,
      message: 'Produto não cadastrado na base de dados.'
    };
  } catch (error) {
    console.error('Error fetching from Open Food Facts API v3:', error);
    return {
      success: false,
      message: 'Erro de conexão/rede ao buscar produto na base pública.'
    };
  }
};
