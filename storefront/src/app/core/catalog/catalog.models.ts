import {
  Product,
  ProductCategory,
  ProductFilterState,
  ProductImage,
  ProductImageType,
  ProductSortOption,
  ProductSpecifications,
  ProductVariant,
} from '../../features/products/models/product.model';

export interface CatalogCategoryDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface CatalogApplicationAreaDto {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface CatalogMediaDto {
  id: string;
  type: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
}

export interface CatalogVariantDto {
  id: string;
  sku: string;
  watt?: number | null;
  lumen?: number | null;
  kelvin?: number | null;
  color?: string | null;
  dimensions?: string | null;
  price: number;
  stock: number;
}

export interface CatalogSpecificationDto {
  id: string;
  name: string;
  value: string;
  unit?: string | null;
  sortOrder: number;
}

export interface CatalogProductListItemDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: CatalogCategoryDto;
  applicationAreas: string[];
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  ipRating?: string | null;
  startingPrice: number;
  watts: number[];
  kelvins: number[];
  featured: boolean;
}

export interface CatalogProductDetailDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string | null;
  category: CatalogCategoryDto;
  applicationAreas: string[];
  media: CatalogMediaDto[];
  specifications: CatalogSpecificationDto[];
  variants: CatalogVariantDto[];
  featured: boolean;
}

export interface PagedCatalogResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CatalogProductQuery {
  categorySlug?: string | null;
  applicationAreas?: string[];
  kelvins?: number[];
  powerRanges?: string[];
  ipClasses?: string[];
  priceRanges?: string[];
  featured?: boolean;
  sort?: ProductSortOption;
  page?: number;
  pageSize?: number;
}

function mapCategory(dto: CatalogCategoryDto): ProductCategory {
  return { id: dto.id, slug: dto.slug, name: dto.name };
}

function mapMediaType(type: string): ProductImageType {
  const upper = type.toUpperCase();
  if (
    upper === 'DEFAULT' ||
    upper === 'GALLERY' ||
    upper === 'LIGHT_ON' ||
    upper === 'LIGHT_OFF' ||
    upper === 'APPLICATION'
  ) {
    return upper;
  }
  return 'GALLERY';
}

function mapSpecs(specs: CatalogSpecificationDto[]): ProductSpecifications {
  const find = (name: string) =>
    specs.find((s) => s.name.toLowerCase() === name.toLowerCase())?.value;

  return {
    ip: find('IP') ?? undefined,
    material: find('Material') ?? undefined,
    voltage: find('Voltage') ?? undefined,
    beamAngle: find('Beam Angle') ?? undefined,
    mounting: find('Mounting') ?? undefined,
  };
}

function mapVariant(dto: CatalogVariantDto): ProductVariant {
  return {
    id: dto.id,
    sku: dto.sku,
    watt: dto.watt ?? undefined,
    lumen: dto.lumen ?? undefined,
    kelvin: dto.kelvin ?? undefined,
    color: dto.color ?? undefined,
    dimensions: dto.dimensions ?? undefined,
    price: dto.price,
    stock: dto.stock,
  };
}

function mapImages(media: CatalogMediaDto[]): ProductImage[] {
  return media
    .filter((m) => m.type.toUpperCase() !== 'DOCUMENT' && m.type.toUpperCase() !== 'VIDEO')
    .map((m) => ({
      url: m.url,
      alt: m.altText ?? '',
      type: mapMediaType(m.type),
    }));
}

export function mapDetailToProduct(dto: CatalogProductDetailDto): Product {
  const images = mapImages(dto.media);
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    shortDescription: dto.shortDescription,
    category: mapCategory(dto.category),
    applicationAreas: dto.applicationAreas,
    images,
    specifications: mapSpecs(dto.specifications),
    variants: dto.variants.map(mapVariant),
    lightOffImage: images.find((i) => i.type === 'LIGHT_OFF')?.url,
    lightOnImage: images.find((i) => i.type === 'LIGHT_ON')?.url,
    documents: dto.media
      .filter((m) => m.type.toUpperCase() === 'DOCUMENT')
      .map((m) => ({
        id: m.id,
        title: m.altText || 'Doküman',
        url: m.url,
      })),
    featured: dto.featured,
  };
}

/** List cards need a Product-shaped object for existing ProductCard. */
export function mapListItemToProduct(dto: CatalogProductListItemDto): Product {
  const images: ProductImage[] = dto.primaryImageUrl
    ? [
        {
          url: dto.primaryImageUrl,
          alt: dto.primaryImageAlt ?? dto.name,
          type: 'DEFAULT',
        },
      ]
    : [];

  const variants: ProductVariant[] =
    dto.watts.length > 0
      ? dto.watts.map((watt, index) => ({
          id: `${dto.id}-w-${watt}`,
          sku: `${dto.slug}-${watt}`,
          watt,
          kelvin: dto.kelvins[index] ?? dto.kelvins[0],
          price: dto.startingPrice,
          stock: 1,
        }))
      : [
          {
            id: `${dto.id}-base`,
            sku: dto.slug,
            kelvin: dto.kelvins[0],
            price: dto.startingPrice,
            stock: 1,
          },
        ];

  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    shortDescription: dto.shortDescription,
    category: mapCategory(dto.category),
    applicationAreas: dto.applicationAreas,
    images,
    specifications: { ip: dto.ipRating ?? undefined },
    variants,
    documents: [],
    featured: dto.featured,
  };
}

export function filtersToQuery(
  filters: ProductFilterState,
  sort: ProductSortOption,
  page = 1,
  pageSize = 48
): CatalogProductQuery {
  return {
    categorySlug: filters.categorySlug,
    applicationAreas: filters.applicationAreas,
    kelvins: filters.kelvins,
    powerRanges: filters.powerRanges,
    ipClasses: filters.ipClasses,
    priceRanges: filters.priceRanges,
    sort,
    page,
    pageSize,
  };
}
