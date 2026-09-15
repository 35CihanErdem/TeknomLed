import { Product, ProductImage, ProductVariant } from '../../products/models/product.model';
import { MOCK_PRODUCTS } from '../../products/data/products.mock';

export interface VariantSelection {
  kelvin: number | null;
  watt: number | null;
  color: string | null;
}

export const KELVIN_LABELS: Record<number, string> = {
  2700: 'Sıcak',
  3000: 'Sıcak Beyaz',
  4000: 'Doğal Beyaz',
  6500: 'Soğuk Beyaz',
};

export function findProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.slug === slug);
}

export function getGalleryImages(product: Product): ProductImage[] {
  const preferred = product.images.filter(
    (image) =>
      image.type === 'DEFAULT' ||
      image.type === 'GALLERY' ||
      image.type === 'APPLICATION'
  );
  const source = preferred.length > 0 ? preferred : product.images;
  const seen = new Set<string>();
  return source.filter((image) => {
    if (seen.has(image.url)) {
      return false;
    }
    seen.add(image.url);
    return true;
  });
}

export function getApplicationImages(product: Product): ProductImage[] {
  return product.images.filter((image) => image.type === 'APPLICATION');
}

/**
 * Genuine LIGHT_OFF / LIGHT_ON pairs only under official product asset paths.
 * Temporary mismatched mock scenes must NOT unlock the comparison UI.
 */
export function getGenuineLightPair(
  product: Product
): { lightOffImage: string; lightOnImage: string } | null {
  const off =
    product.images.find((image) => image.type === 'LIGHT_OFF')?.url ??
    product.lightOffImage;
  const on =
    product.images.find((image) => image.type === 'LIGHT_ON')?.url ??
    product.lightOnImage;

  if (!off || !on || off === on) {
    return null;
  }

  const official =
    /\/assets\/images\/products\/[^/]+\/light-(off|on)\.(webp|jpg|jpeg|png)$/i;
  if (!official.test(off) || !official.test(on)) {
    return null;
  }

  return { lightOffImage: off, lightOnImage: on };
}

export function uniqueKelvins(variants: ProductVariant[]): number[] {
  return [
    ...new Set(
      variants
        .map((variant) => variant.kelvin)
        .filter((value): value is number => value != null)
    ),
  ].sort((a, b) => a - b);
}

export function uniqueWatts(variants: ProductVariant[]): number[] {
  return [
    ...new Set(
      variants
        .map((variant) => variant.watt)
        .filter((value): value is number => value != null)
    ),
  ].sort((a, b) => a - b);
}

export function uniqueColors(variants: ProductVariant[]): string[] {
  return [
    ...new Set(
      variants
        .map((variant) => variant.color)
        .filter((value): value is string => !!value)
    ),
  ].sort((a, b) => a.localeCompare(b, 'tr'));
}

export function createInitialSelection(
  variants: ProductVariant[]
): VariantSelection {
  const first = variants[0];
  return {
    kelvin: first?.kelvin ?? null,
    watt: first?.watt ?? null,
    color: first?.color ?? null,
  };
}

export function findMatchingVariant(
  variants: ProductVariant[],
  selection: VariantSelection
): ProductVariant | undefined {
  return variants.find((variant) => {
    if (selection.kelvin != null && variant.kelvin !== selection.kelvin) {
      return false;
    }
    if (selection.watt != null && variant.watt !== selection.watt) {
      return false;
    }
    if (selection.color != null && variant.color !== selection.color) {
      return false;
    }
    return true;
  });
}

export function isKelvinAvailable(
  variants: ProductVariant[],
  _selection: VariantSelection,
  kelvin: number
): boolean {
  return variants.some((variant) => variant.kelvin === kelvin);
}

export function isWattAvailable(
  variants: ProductVariant[],
  _selection: VariantSelection,
  watt: number
): boolean {
  return variants.some((variant) => variant.watt === watt);
}

export function isColorAvailable(
  variants: ProductVariant[],
  _selection: VariantSelection,
  color: string
): boolean {
  return variants.some((variant) => variant.color === color);
}

/** After changing one attribute, coerce selection to a real existing variant. */
export function resolveSelection(
  variants: ProductVariant[],
  next: VariantSelection
): VariantSelection {
  const exact = findMatchingVariant(variants, next);
  if (exact) {
    return {
      kelvin: exact.kelvin ?? null,
      watt: exact.watt ?? null,
      color: exact.color ?? null,
    };
  }

  const byKelvin = variants.filter(
    (variant) => next.kelvin == null || variant.kelvin === next.kelvin
  );
  const byColor = byKelvin.filter(
    (variant) => next.color == null || variant.color === next.color
  );
  const pool = byColor.length > 0 ? byColor : byKelvin.length > 0 ? byKelvin : variants;
  const preferred =
    pool.find((variant) => next.watt != null && variant.watt === next.watt) ??
    pool[0];

  return {
    kelvin: preferred?.kelvin ?? null,
    watt: preferred?.watt ?? null,
    color: preferred?.color ?? null,
  };
}

export function getStockLabel(stock: number): string {
  if (stock <= 0) {
    return 'Stokta yok';
  }
  if (stock <= 8) {
    return 'Sınırlı stok';
  }
  return 'Stokta';
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  const sameCategory = MOCK_PRODUCTS.filter(
    (item) =>
      item.id !== product.id && item.category.slug === product.category.slug
  );

  const overlapping = MOCK_PRODUCTS.filter((item) => {
    if (item.id === product.id) {
      return false;
    }
    if (sameCategory.some((related) => related.id === item.id)) {
      return false;
    }
    return item.applicationAreas.some((area) =>
      product.applicationAreas.includes(area)
    );
  });

  return [...sameCategory, ...overlapping].slice(0, limit);
}
