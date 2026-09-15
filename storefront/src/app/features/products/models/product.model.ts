export type ProductImageType =
  | 'DEFAULT'
  | 'GALLERY'
  | 'LIGHT_ON'
  | 'LIGHT_OFF'
  | 'APPLICATION';

export interface ProductImage {
  url: string;
  alt: string;
  type: ProductImageType;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  watt?: number;
  lumen?: number;
  kelvin?: number;
  color?: string;
  dimensions?: string;
  price: number;
  stock: number;
}

export interface ProductSpecifications {
  ip?: string;
  material?: string;
  voltage?: string;
  beamAngle?: string;
  mounting?: string;
}

export interface ProductDocument {
  id: string;
  title: string;
  url: string;
}

/** Storefront product domain model — category ≠ application area. */
export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ProductCategory;
  applicationAreas: string[];
  images: ProductImage[];
  specifications: ProductSpecifications;
  variants: ProductVariant[];
  lightOffImage?: string;
  lightOnImage?: string;
  documents: ProductDocument[];
  featured: boolean;
}

export type ProductSortOption =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

export type PowerRangeId = '0-10' | '11-20' | '21-40' | '40+';
export type PriceRangeId = '0-1000' | '1000-2500' | '2500-5000' | '5000+';

export interface ProductFilterState {
  categorySlug: string | null;
  applicationAreas: string[];
  kelvins: number[];
  powerRanges: PowerRangeId[];
  ipClasses: string[];
  priceRanges: PriceRangeId[];
}

export interface ActiveFilterChip {
  id: string;
  group: keyof ProductFilterState | 'category';
  label: string;
  value: string | number;
}
