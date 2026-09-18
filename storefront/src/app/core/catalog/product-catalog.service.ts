import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductCategory, ProductSortOption } from '../../features/products/models/product.model';
import {
  CatalogApplicationAreaDto,
  CatalogCategoryDto,
  CatalogProductDetailDto,
  CatalogProductListItemDto,
  CatalogProductQuery,
  PagedCatalogResult,
  mapDetailToProduct,
  mapListItemToProduct,
} from './catalog.models';

/**
 * API-backed catalog. Price/stock from backend are display values only —
 * order creation must re-resolve them server-side (future Orders phase).
 */
@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, '');

  private readonly productCache = signal<Map<string, Product>>(new Map());
  private categories$?: Observable<ProductCategory[]>;
  private applicationAreas$?: Observable<CatalogApplicationAreaDto[]>;

  readonly cacheVersion = signal(0);

  getCachedProduct(productId: string): Product | undefined {
    return this.productCache().get(productId);
  }

  getCachedProducts(): Product[] {
    return [...this.productCache().values()];
  }

  getProducts(
    query: CatalogProductQuery
  ): Observable<{ products: Product[]; totalItems: number; page: number; pageSize: number }> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 48));

    if (query.categorySlug) {
      params = params.set('category', query.categorySlug);
    }
    for (const area of query.applicationAreas ?? []) {
      params = params.append('applicationArea', area);
    }
    for (const kelvin of query.kelvins ?? []) {
      params = params.append('kelvin', String(kelvin));
    }
    for (const range of query.powerRanges ?? []) {
      params = params.append('powerRanges', range);
    }
    for (const ip of query.ipClasses ?? []) {
      params = params.append('ip', ip);
    }
    for (const range of query.priceRanges ?? []) {
      params = params.append('priceRanges', range);
    }
    if (query.featured === true) {
      params = params.set('featured', 'true');
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    return this.http
      .get<PagedCatalogResult<CatalogProductListItemDto>>(
        `${this.apiBase}/api/products`,
        { params }
      )
      .pipe(
        map((page) => ({
          products: page.items.map(mapListItemToProduct),
          totalItems: page.totalItems,
          page: page.page,
          pageSize: page.pageSize,
        })),
        catchError((err) => throwError(() => err))
      );
  }

  getProductBySlug(slug: string): Observable<Product | null> {
    return this.http
      .get<CatalogProductDetailDto>(`${this.apiBase}/api/products/${encodeURIComponent(slug)}`)
      .pipe(
        map((dto) => {
          const product = mapDetailToProduct(dto);
          this.putCache(product);
          return product;
        }),
        catchError((err) => {
          if (err?.status === 404) {
            return of(null);
          }
          return throwError(() => err);
        })
      );
  }

  getCategories(): Observable<ProductCategory[]> {
    if (!this.categories$) {
      this.categories$ = this.http
        .get<CatalogCategoryDto[]>(`${this.apiBase}/api/categories`)
        .pipe(
          map((items) =>
            items.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))
          ),
          shareReplay(1)
        );
    }
    return this.categories$;
  }

  getApplicationAreas(): Observable<CatalogApplicationAreaDto[]> {
    if (!this.applicationAreas$) {
      this.applicationAreas$ = this.http
        .get<CatalogApplicationAreaDto[]>(`${this.apiBase}/api/application-areas`)
        .pipe(shareReplay(1));
    }
    return this.applicationAreas$;
  }

  getFeaturedProducts(limit = 8): Observable<Product[]> {
    return this.getProducts({
      featured: true,
      sort: 'recommended',
      page: 1,
      pageSize: limit,
    }).pipe(map((result) => result.products));
  }

  getRelatedProducts(slug: string, limit = 3): Observable<Product[]> {
    return this.http
      .get<CatalogProductListItemDto[]>(
        `${this.apiBase}/api/products/${encodeURIComponent(slug)}/related`,
        { params: new HttpParams().set('limit', String(limit)) }
      )
      .pipe(map((items) => items.map(mapListItemToProduct)));
  }

  /** Hydrate cart lines from backend product/variant truth. */
  resolveProductsByIds(ids: string[]): Observable<Product[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) {
      return of([]);
    }

    const missing = unique.filter((id) => !this.productCache().has(id));
    if (missing.length === 0) {
      return of(unique.map((id) => this.productCache().get(id)!).filter(Boolean));
    }

    return this.http
      .post<CatalogProductDetailDto[]>(`${this.apiBase}/api/products/batch`, missing)
      .pipe(
        map((dtos) => {
          for (const dto of dtos) {
            this.putCache(mapDetailToProduct(dto));
          }
          return unique
            .map((id) => this.productCache().get(id))
            .filter((p): p is Product => p != null);
        }),
        catchError(() => of([]))
      );
  }

  warmCache(sort: ProductSortOption = 'recommended'): Observable<Product[]> {
    return this.getProducts({ sort, page: 1, pageSize: 48 }).pipe(
      map((result) => result.products)
    );
  }

  private putCache(product: Product): void {
    this.productCache.update((current) => {
      const next = new Map(current);
      next.set(product.id, product);
      return next;
    });
    this.cacheVersion.update((v) => v + 1);
  }
}
