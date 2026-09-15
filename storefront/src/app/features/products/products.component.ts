import { Component, computed, signal } from '@angular/core';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { ProductsHeaderComponent } from './components/products-header/products-header.component';
import { CategoryNavigationComponent } from './components/category-navigation/category-navigation.component';
import { ProductToolbarComponent } from './components/product-toolbar/product-toolbar.component';
import { ProductFilterComponent } from './components/product-filter/product-filter.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import {
  APPLICATION_AREAS,
  FILTER_IP_CLASSES,
  FILTER_KELVINS,
  MOCK_PRODUCTS,
  PRODUCT_CATEGORIES,
} from './data/products.mock';
import {
  ActiveFilterChip,
  PowerRangeId,
  PriceRangeId,
  ProductFilterState,
  ProductSortOption,
} from './models/product.model';
import {
  buildActiveFilterChips,
  createEmptyFilters,
  filterProducts,
  sortProducts,
  toggleListValue,
} from './utils/product-catalog.utils';

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
export class ProductsComponent {
  readonly categories = PRODUCT_CATEGORIES;
  readonly applicationAreas = APPLICATION_AREAS;
  readonly kelvins = FILTER_KELVINS;
  readonly ipClasses = FILTER_IP_CLASSES;

  readonly filters = signal<ProductFilterState>(createEmptyFilters());
  readonly sort = signal<ProductSortOption>('recommended');
  readonly filterOpen = signal(false);

  readonly filteredProducts = computed(() =>
    filterProducts(MOCK_PRODUCTS, this.filters())
  );

  readonly sortedProducts = computed(() =>
    sortProducts(this.filteredProducts(), this.sort())
  );

  readonly resultCount = computed(() => this.sortedProducts().length);

  readonly activeChips = computed(() =>
    buildActiveFilterChips(this.filters(), this.categories)
  );

  onCategoryChange(slug: string | null): void {
    this.filters.update((current) => ({
      ...current,
      categorySlug: slug,
    }));
  }

  onSortChange(sort: ProductSortOption): void {
    this.sort.set(sort);
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
  }

  toggleKelvin(kelvin: number): void {
    this.filters.update((current) => ({
      ...current,
      kelvins: toggleListValue(current.kelvins, kelvin),
    }));
  }

  togglePower(range: PowerRangeId): void {
    this.filters.update((current) => ({
      ...current,
      powerRanges: toggleListValue(current.powerRanges, range),
    }));
  }

  toggleIp(ip: string): void {
    this.filters.update((current) => ({
      ...current,
      ipClasses: toggleListValue(current.ipClasses, ip),
    }));
  }

  togglePrice(range: PriceRangeId): void {
    this.filters.update((current) => ({
      ...current,
      priceRanges: toggleListValue(current.priceRanges, range),
    }));
  }

  clearFilters(): void {
    this.filters.set(createEmptyFilters());
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
  }
}
