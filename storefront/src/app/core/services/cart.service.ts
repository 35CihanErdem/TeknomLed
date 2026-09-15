import { Injectable, computed, signal } from '@angular/core';
import { MOCK_PRODUCTS } from '../../features/products/data/products.mock';
import { Product, ProductVariant } from '../../features/products/models/product.model';
import { getPrimaryImage } from '../../features/products/utils/product-catalog.utils';
import { CartItem, DetailedCartItem } from '../../features/cart/models/cart.model';

const STORAGE_KEY = 'teknomled.storefront.cart.v1';

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item['productId'] === 'string' &&
    typeof item['variantId'] === 'string' &&
    typeof item['quantity'] === 'number' &&
    Number.isFinite(item['quantity'])
  );
}

function findProduct(productId: string): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.id === productId);
}

function findVariant(
  product: Product,
  variantId: string
): ProductVariant | undefined {
  return product.variants.find((variant) => variant.id === variantId);
}

function buildVariantSummary(variant: ProductVariant): string {
  const parts: string[] = [];
  if (variant.kelvin != null) {
    parts.push(`${variant.kelvin}K`);
  }
  if (variant.watt != null) {
    parts.push(`${variant.watt}W`);
  }
  if (variant.color) {
    parts.push(variant.color);
  }
  return parts.join(' · ');
}

function sanitizeItems(items: CartItem[]): CartItem[] {
  const cleaned: CartItem[] = [];

  for (const item of items) {
    if (!isCartItem(item)) {
      continue;
    }

    const product = findProduct(item.productId);
    if (!product) {
      continue;
    }

    const variant = findVariant(product, item.variantId);
    if (!variant || variant.stock <= 0) {
      continue;
    }

    const quantity = Math.min(
      Math.max(1, Math.floor(item.quantity)),
      variant.stock
    );

    const existingIndex = cleaned.findIndex(
      (entry) =>
        entry.productId === item.productId && entry.variantId === item.variantId
    );

    if (existingIndex >= 0) {
      const existing = cleaned[existingIndex];
      cleaned[existingIndex] = {
        ...existing,
        quantity: Math.min(existing.quantity + quantity, variant.stock),
      };
      continue;
    }

    cleaned.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity,
    });
  }

  return cleaned;
}

function readStoredCart(): CartItem[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sanitizeItems(parsed);
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(readStoredCart());

  readonly items = this.itemsSignal.asReadonly();

  readonly detailedItems = computed<DetailedCartItem[]>(() =>
    this.itemsSignal()
      .map((item) => this.toDetailedItem(item))
      .filter((item): item is DetailedCartItem => item != null)
  );

  readonly totalQuantity = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.detailedItems().reduce((sum, item) => sum + item.lineTotal, 0)
  );

  readonly isEmpty = computed(() => this.detailedItems().length === 0);

  readonly lineCount = computed(() => this.detailedItems().length);

  addItem(productId: string, variantId: string, quantity = 1): boolean {
    const product = findProduct(productId);
    const variant = product ? findVariant(product, variantId) : undefined;
    if (!product || !variant || variant.stock <= 0) {
      return false;
    }

    const amount = Math.min(Math.max(1, Math.floor(quantity)), variant.stock);

    this.itemsSignal.update((items) => {
      const index = items.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (index === -1) {
        return sanitizeItems([
          ...items,
          { productId, variantId, quantity: amount },
        ]);
      }

      const next = items.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Math.min(item.quantity + amount, variant.stock),
            }
          : item
      );
      return sanitizeItems(next);
    });

    this.persist();
    return true;
  }

  removeItem(productId: string, variantId: string): void {
    this.itemsSignal.update((items) =>
      items.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      )
    );
    this.persist();
  }

  updateQuantity(productId: string, variantId: string, quantity: number): void {
    const product = findProduct(productId);
    const variant = product ? findVariant(product, variantId) : undefined;
    if (!product || !variant || variant.stock <= 0) {
      this.removeItem(productId, variantId);
      return;
    }

    const nextQuantity = Math.min(
      Math.max(1, Math.floor(quantity)),
      variant.stock
    );

    this.itemsSignal.update((items) =>
      items.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
    this.persist();
  }

  increment(productId: string, variantId: string): void {
    const item = this.itemsSignal().find(
      (entry) =>
        entry.productId === productId && entry.variantId === variantId
    );
    if (!item) {
      return;
    }
    this.updateQuantity(productId, variantId, item.quantity + 1);
  }

  decrement(productId: string, variantId: string): void {
    const item = this.itemsSignal().find(
      (entry) =>
        entry.productId === productId && entry.variantId === variantId
    );
    if (!item) {
      return;
    }
    // Minimum stays at 1 — explicit remove required
    if (item.quantity <= 1) {
      return;
    }
    this.updateQuantity(productId, variantId, item.quantity - 1);
  }

  clearCart(): void {
    this.itemsSignal.set([]);
    this.persist();
  }

  private toDetailedItem(item: CartItem): DetailedCartItem | null {
    const product = findProduct(item.productId);
    if (!product) {
      return null;
    }

    const variant = findVariant(product, item.variantId);
    if (!variant) {
      return null;
    }

    const quantity = Math.min(Math.max(1, item.quantity), Math.max(variant.stock, 1));
    const imageUrl = getPrimaryImage(product);
    const imageAlt =
      product.images.find((image) => image.type === 'DEFAULT')?.alt ??
      product.name;

    return {
      productId: product.id,
      variantId: variant.id,
      quantity,
      productName: product.name,
      productSlug: product.slug,
      categoryName: product.category.name,
      variantSummary: buildVariantSummary(variant),
      sku: variant.sku,
      unitPrice: variant.price,
      lineTotal: variant.price * quantity,
      stock: variant.stock,
      imageUrl,
      imageAlt,
      available: variant.stock > 0,
    };
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsSignal()));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }
}
