/** Admin-only catalog contracts — may include inactive/draft fields. */

export interface AdminPagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminCategoryDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAtUtc: string;
}

export interface AdminApplicationAreaDto {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminProductListItemDto {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  variantCount: number;
  isActive: boolean;
  isFeatured: boolean;
  updatedAtUtc: string;
}

export interface AdminCategoryRefDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface AdminMediaDto {
  id: string;
  type: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
}

export interface AdminSpecificationDto {
  id: string;
  name: string;
  value: string;
  unit?: string | null;
  sortOrder: number;
}

export interface AdminVariantDto {
  id: string;
  sku: string;
  watt?: number | null;
  lumen?: number | null;
  kelvin?: number | null;
  color?: string | null;
  dimensions?: string | null;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface AdminProductDetailDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string | null;
  categoryId: string;
  category: AdminCategoryRefDto;
  applicationAreaIds: string[];
  applicationAreaNames: string[];
  media: AdminMediaDto[];
  specifications: AdminSpecificationDto[];
  variants: AdminVariantDto[];
  isFeatured: boolean;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface AdminProductQuery {
  search?: string;
  category?: string;
  isActive?: boolean | null;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminVariantInput {
  id?: string | null;
  sku: string;
  watt?: number | null;
  lumen?: number | null;
  kelvin?: number | null;
  color?: string | null;
  dimensions?: string | null;
  price: number;
  stock: number;
  isActive?: boolean;
}

export interface AdminSpecificationInput {
  id?: string | null;
  name: string;
  value: string;
  unit?: string | null;
  sortOrder: number;
}

export interface AdminMediaInput {
  id?: string | null;
  type: string;
  path: string;
  altText?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface AdminProductWriteRequest {
  slug: string;
  name: string;
  shortDescription: string;
  description?: string | null;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  applicationAreaIds: string[];
  variants: AdminVariantInput[];
  specifications: AdminSpecificationInput[];
  media: AdminMediaInput[];
}

export interface AdminCategoryWriteRequest {
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminApplicationAreaWriteRequest {
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminApiError {
  error?: {
    code?: string;
    message?: string;
  };
}
