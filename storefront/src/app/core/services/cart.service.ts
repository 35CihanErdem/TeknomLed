import { Injectable, computed, inject, signal } from '@angular/core';
import { Product, ProductVariant } from '../../features/products/models/product.model';
import { getPrimaryImage } from '../../features/products/utils/product-catalog.utils';
import { CartItem, DetailedCartItem } from '../../features/cart/models/cart.model';
import { ProductCatalogService } from '../catalog/product-catalog.service';

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

function readRawCart(): CartItem[] {
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
    return parsed.filter(isCartItem).map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
  } catch {
    return [];
  }
}

/**
 * Cart identity stays in localStorage (productId + variantId + quantity).
 * Display price/stock always resolve from ProductCatalogService (backend).
 * Frontend is never the source of truth for order pricing.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly catalog = inject(ProductCatalogService);

  private readonly itemsSignal = signal<CartItem[]>(readRawCart());
  private readonly hydratedSignal = signal(false);

  readonly items = this.itemsSignal.asReadonly();
  readonly hydrated = this.hydratedSignal.asReadonly();

  readonly detailedItems = computed<DetailedCartItem[]>(() => {
    // Depend on catalog cache updates.
    this.catalog.cacheVersion();
    return this.itemsSignal()
      .map((item) => this.toDetailedItem(item))
      .filter((item): item is DetailedCartItem => item != null);
  });

  readonly staleCount = computed(() => {
    this.catalog.cacheVersion();
    if (!this.hydratedSignal()) {
      return 0;
    }
    return this.itemsSignal().filter((item) => this.toDetailedItem(item) == null)
      .length;
  });

  readonly totalQuantity = computed(() =>
    this.detailedItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.detailedItems().reduce((sum, item) => sum + item.lineTotal, 0)
  );

  readonly isEmpty = computed(() => this.detailedItems().length === 0);

  readonly lineCount = computed(() => this.detailedItems().length);

  constructor() {
    this.hydrateFromCatalog();
  }

  addItem(productId: string, variantId: string, quantity = 1): boolean {
    const product = this.catalog.getCachedProduct(productId);
    const variant = product
      ? product.variants.find((entry) => entry.id === variantId)
      : undefined;
    if (!product || !variant || variant.stock <= 0) {
      return false;
    }

    const amount = Math.min(Math.max(1, Math.floor(quantity)), variant.stock);

    this.itemsSignal.update((items) => {
      const index = items.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (index === -1) {
        return this.mergeItems([
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
      return this.mergeItems(next);
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
    const product = this.catalog.getCachedProduct(productId);
    const variant = product
      ? product.variants.find((entry) => entry.id === variantId)
      : undefined;
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
    if (item.quantity <= 1) {
      return;
    }
    this.updateQuantity(productId, variantId, item.quantity - 1);
  }

  clearCart(): void {
    this.itemsSignal.set([]);
    this.persist();
  }

  /** Drop lines that no longer resolve after catalog hydration. */
  pruneStaleLines(): void {
    if (!this.hydratedSignal()) {
      return;
    }
    const valid = this.itemsSignal().filter(
      (item) => this.toDetailedItem(item) != null
    );
    if (valid.length !== this.itemsSignal().length) {
      this.itemsSignal.set(valid);
      this.persist();
    }
  }

  private hydrateFromCatalog(): void {
    const ids = this.itemsSignal().map((item) => item.productId);
    this.catalog.resolveProductsByIds(ids).subscribe({
      next: () => {
        this.hydratedSignal.set(true);
        this.pruneStaleLines();
      },
      error: () => {
        this.hydratedSignal.set(true);
      },
    });
  }

  private mergeItems(items: CartItem[]): CartItem[] {
    const cleaned: CartItem[] = [];
    for (const item of items) {
      if (!isCartItem(item)) {
        continue;
      }
      const product = this.catalog.getCachedProduct(item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (this.hydratedSignal() && (!product || !variant || variant.stock <= 0)) {
        continue;
      }

      const maxStock = variant?.stock ?? item.quantity;
      const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), maxStock);
      const existingIndex = cleaned.findIndex(
        (entry) =>
          entry.productId === item.productId && entry.variantId === item.variantId
      );
      if (existingIndex >= 0) {
        cleaned[existingIndex] = {
          ...cleaned[existingIndex],
          quantity: Math.min(
            cleaned[existingIndex].quantity + quantity,
            maxStock
          ),
        };
      } else {
        cleaned.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity,
        });
      }
    }
    return cleaned;
  }

  private toDetailedItem(item: CartItem): DetailedCartItem | null {
    const product = this.catalog.getCachedProduct(item.productId);
    if (!product) {
      return null;
    }

    const variant = product.variants.find((entry) => entry.id === item.variantId);
    if (!variant) {
      return null;
    }

    const quantity = Math.min(
      Math.max(1, item.quantity),
      Math.max(variant.stock, 1)
    );
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
