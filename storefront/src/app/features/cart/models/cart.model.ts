export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface DetailedCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  categoryName: string;
  variantSummary: string;
  sku: string;
  unitPrice: number;
  lineTotal: number;
  stock: number;
  imageUrl: string;
  imageAlt: string;
  available: boolean;
}
