import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { ProductsHeaderComponent } from './components/products-header/products-header.component';
import { CategoryNavigationComponent } from './components/category-navigation/category-navigation.component';
import { ProductToolbarComponent } from './components/product-toolbar/product-toolbar.component';
import { ProductFilterComponent } from './components/product-filter/product-filter.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import {
  FILTER_IP_CLASSES,
  FILTER_KELVINS,
} from './data/products.mock';
import {
  ActiveFilterChip,
  PowerRangeId,
  PriceRangeId,
  Product,
  ProductCategory,
  ProductFilterState,
  ProductSortOption,
} from './models/product.model';
import {
  buildActiveFilterChips,
  createEmptyFilters,
  toggleListValue,
} from './utils/product-catalog.utils';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import { filtersToQuery } from '../../core/catalog/catalog.models';
import { Subject, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ContainerComponent,
    ProductsHeaderComponent,
    CategoryNavigationComponent,
    ProductToolbarComponent,
    ProductFilterComponent,
    ProductGridComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly catalog = inject(ProductCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  readonly categories = signal<ProductCategory[]>([]);
  readonly applicationAreas = signal<string[]>([]);
  readonly kelvins = FILTER_KELVINS;
  readonly ipClasses = FILTER_IP_CLASSES;

  readonly filters = signal<ProductFilterState>(createEmptyFilters());
  readonly sort = signal<ProductSortOption>('recommended');
  readonly filterOpen = signal(false);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly resultCount = signal(0);

  readonly activeChips = computed(() =>
    buildActiveFilterChips(this.filters(), this.categories())
  );

  ngOnInit(): void {
    this.catalog
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
      });

    this.catalog
      .getApplicationAreas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (areas) => this.applicationAreas.set(areas.map((a) => a.name)),
      });

    this.reload$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.catalog.getProducts(
            filtersToQuery(this.filters(), this.sort(), 1, 48)
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.products);
          this.resultCount.set(result.totalItems);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.resultCount.set(0);
          this.loading.set(false);
          this.error.set('Ürünler yüklenemedi. Lütfen tekrar deneyin.');
        },
      });

    this.reload$.next();
  }

  onCategoryChange(slug: string | null): void {
    this.filters.update((current) => ({
      ...current,
      categorySlug: slug,
    }));
    this.reload$.next();
  }

  onSortChange(sort: ProductSortOption): void {
    this.sort.set(sort);
    this.reload$.next();
  }

  toggleFilterPanel(): void {
    this.filterOpen.update((open) => !open);
  }

  closeFilterPanel(): void {
    this.filterOpen.set(false);
  }

  toggleApplication(area: string): void {
    this.filters.update((current) => ({
      ...current,
      applicationAreas: toggleListValue(current.applicationAreas, area),
    }));
    this.reload$.next();
  }

  toggleKelvin(kelvin: number): void {
    this.filters.update((current) => ({
      ...current,
      kelvins: toggleListValue(current.kelvins, kelvin),
    }));
    this.reload$.next();
  }

  togglePower(range: PowerRangeId): void {
    this.filters.update((current) => ({
      ...current,
      powerRanges: toggleListValue(current.powerRanges, range),
    }));
    this.reload$.next();
  }

  toggleIp(ip: string): void {
    this.filters.update((current) => ({
      ...current,
      ipClasses: toggleListValue(current.ipClasses, ip),
    }));
    this.reload$.next();
  }

  togglePrice(range: PriceRangeId): void {
    this.filters.update((current) => ({
      ...current,
      priceRanges: toggleListValue(current.priceRanges, range),
    }));
    this.reload$.next();
  }

  clearFilters(): void {
    this.filters.set(createEmptyFilters());
    this.reload$.next();
  }

  removeChip(chip: ActiveFilterChip): void {
    this.filters.update((current) => {
      if (chip.group === 'category') {
        return { ...current, categorySlug: null };
      }

      if (chip.group === 'applicationAreas') {
        return {
          ...current,
          applicationAreas: current.applicationAreas.filter(
            (item) => item !== chip.value
          ),
        };
      }

      if (chip.group === 'kelvins') {
        return {
          ...current,
          kelvins: current.kelvins.filter((item) => item !== chip.value),
        };
      }

      if (chip.group === 'powerRanges') {
        return {
          ...current,
          powerRanges: current.powerRanges.filter(
            (item) => item !== chip.value
          ),
        };
      }

      if (chip.group === 'ipClasses') {
        return {
          ...current,
          ipClasses: current.ipClasses.filter((item) => item !== chip.value),
        };
      }

      if (chip.group === 'priceRanges') {
        return {
          ...current,
          priceRanges: current.priceRanges.filter(
            (item) => item !== chip.value
          ),
        };
      }

      return current;
    });
    this.reload$.next();
  }
}
