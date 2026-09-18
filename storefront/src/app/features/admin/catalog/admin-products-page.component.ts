import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCatalogService } from '../../../core/admin/admin-catalog.service';
import {
  AdminCategoryDto,
  AdminProductListItemDto,
} from '../../../core/admin/admin-catalog.models';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission } from '../../../core/auth/permissions';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
})
export class AdminProductsPageComponent implements OnInit {
  private readonly catalog = inject(AdminCatalogService);
  private readonly auth = inject(AuthService);

  readonly Permission = Permission;
  readonly items = signal<AdminProductListItemDto[]>([]);
  readonly categories = signal<AdminCategoryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  search = '';
  category = '';
  status: '' | 'true' | 'false' = '';
  page = 1;
  readonly pageSize = 24;

  get canCreate(): boolean {
    return this.auth.can(Permission.ProductCreate);
  }

  get canUpdate(): boolean {
    return this.auth.can(Permission.ProductUpdate);
  }

  ngOnInit(): void {
    this.catalog.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.catalog
      .getProducts({
        search: this.search || undefined,
        category: this.category || undefined,
        isActive:
          this.status === '' ? null : this.status === 'true',
        page: this.page,
        pageSize: this.pageSize,
        sort: 'updated-desc',
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalItems.set(result.totalItems);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.catalog.extractErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goPage(delta: number): void {
    const next = this.page + delta;
    if (next < 1 || (this.totalPages() > 0 && next > this.totalPages())) {
      return;
    }
    this.page = next;
    this.load();
  }

  deactivate(item: AdminProductListItemDto): void {
    if (!this.canUpdate || !item.isActive) {
      return;
    }
    if (!window.confirm(`“${item.name}” pasifleştirilsin mi?`)) {
      return;
    }
    this.catalog.deactivateProduct(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
    });
  }
}
