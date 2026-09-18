import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminApiError,
  AdminApplicationAreaDto,
  AdminApplicationAreaWriteRequest,
  AdminCategoryDto,
  AdminCategoryWriteRequest,
  AdminMediaDto,
  AdminPagedResult,
  AdminProductDetailDto,
  AdminProductListItemDto,
  AdminProductQuery,
  AdminProductWriteRequest,
} from './admin-catalog.models';

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, '');

  getProducts(
    query: AdminProductQuery
  ): Observable<AdminPagedResult<AdminProductListItemDto>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 24));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.category?.trim()) {
      params = params.set('category', query.category.trim());
    }
    if (query.isActive === true || query.isActive === false) {
      params = params.set('isActive', String(query.isActive));
    }
    if (query.sort?.trim()) {
      params = params.set('sort', query.sort.trim());
    }

    return this.http
      .get<AdminPagedResult<AdminProductListItemDto>>(
        `${this.apiBase}/api/admin/products`,
        { params }
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  getProduct(id: string): Observable<AdminProductDetailDto> {
    return this.http
      .get<AdminProductDetailDto>(`${this.apiBase}/api/admin/products/${id}`)
      .pipe(catchError((err) => this.mapError(err)));
  }

  createProduct(body: AdminProductWriteRequest): Observable<AdminProductDetailDto> {
    return this.http
      .post<AdminProductDetailDto>(`${this.apiBase}/api/admin/products`, body)
      .pipe(catchError((err) => this.mapError(err)));
  }

  updateProduct(
    id: string,
    body: AdminProductWriteRequest
  ): Observable<AdminProductDetailDto> {
    return this.http
      .put<AdminProductDetailDto>(`${this.apiBase}/api/admin/products/${id}`, body)
      .pipe(catchError((err) => this.mapError(err)));
  }

  deactivateProduct(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBase}/api/admin/products/${id}`)
      .pipe(catchError((err) => this.mapError(err)));
  }

  getCategories(): Observable<AdminCategoryDto[]> {
    return this.http
      .get<AdminCategoryDto[]>(`${this.apiBase}/api/admin/categories`)
      .pipe(catchError((err) => this.mapError(err)));
  }

  createCategory(body: AdminCategoryWriteRequest): Observable<AdminCategoryDto> {
    return this.http
      .post<AdminCategoryDto>(`${this.apiBase}/api/admin/categories`, body)
      .pipe(catchError((err) => this.mapError(err)));
  }

  updateCategory(
    id: string,
    body: AdminCategoryWriteRequest
  ): Observable<AdminCategoryDto> {
    return this.http
      .put<AdminCategoryDto>(`${this.apiBase}/api/admin/categories/${id}`, body)
      .pipe(catchError((err) => this.mapError(err)));
  }

  getApplicationAreas(): Observable<AdminApplicationAreaDto[]> {
    return this.http
      .get<AdminApplicationAreaDto[]>(`${this.apiBase}/api/admin/application-areas`)
      .pipe(catchError((err) => this.mapError(err)));
  }

  createApplicationArea(
    body: AdminApplicationAreaWriteRequest
  ): Observable<AdminApplicationAreaDto> {
    return this.http
      .post<AdminApplicationAreaDto>(
        `${this.apiBase}/api/admin/application-areas`,
        body
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  updateApplicationArea(
    id: string,
    body: AdminApplicationAreaWriteRequest
  ): Observable<AdminApplicationAreaDto> {
    return this.http
      .put<AdminApplicationAreaDto>(
        `${this.apiBase}/api/admin/application-areas/${id}`,
        body
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  uploadProductMedia(
    productId: string,
    file: File,
    type: string,
    altText?: string,
    sortOrder?: number
  ): Observable<AdminMediaDto> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('type', type);
    if (altText?.trim()) {
      form.append('altText', altText.trim());
    }
    if (sortOrder != null) {
      form.append('sortOrder', String(sortOrder));
    }

    return this.http
      .post<AdminMediaDto>(
        `${this.apiBase}/api/admin/products/${productId}/media`,
        form
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  updateProductMedia(
    productId: string,
    mediaId: string,
    body: {
      type: string;
      altText?: string | null;
      sortOrder: number;
      isActive: boolean;
    }
  ): Observable<AdminMediaDto> {
    return this.http
      .put<AdminMediaDto>(
        `${this.apiBase}/api/admin/products/${productId}/media/${mediaId}`,
        body
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  deleteProductMedia(productId: string, mediaId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${this.apiBase}/api/admin/products/${productId}/media/${mediaId}`
      )
      .pipe(catchError((err) => this.mapError(err)));
  }

  extractErrorMessage(err: unknown, fallback = 'İşlem başarısız.'): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as AdminApiError | string | null;
      if (body && typeof body === 'object' && body.error?.message) {
        return body.error.message;
      }
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (err.message) {
        return err.message;
      }
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }

  private mapError(err: unknown) {
    return throwError(() => err);
  }
}
