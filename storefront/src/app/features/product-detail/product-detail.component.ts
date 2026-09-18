import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { LightComparisonComponent } from '../../shared/components/light-comparison/light-comparison.component';
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';
import { ProductTechSummaryComponent } from './components/product-tech-summary/product-tech-summary.component';
import { ProductSpecificationsComponent } from './components/product-specifications/product-specifications.component';
import { ProductApplicationComponent } from './components/product-application/product-application.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import { Product } from '../products/models/product.model';
import {
  VariantSelection,
  createInitialSelection,
  findMatchingVariant,
  getApplicationImages,
  getGalleryImages,
  getGenuineLightPair,
  resolveSelection,
} from './utils/product-detail.utils';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    ContainerComponent,
    LightComparisonComponent,
    ProductGalleryComponent,
    ProductInfoComponent,
    ProductTechSummaryComponent,
    ProductSpecificationsComponent,
    ProductApplicationComponent,
    RelatedProductsComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartService);
  private readonly catalog = inject(ProductCatalogService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly product = signal<Product | null>(null);
  readonly relatedProducts = signal<Product[]>([]);

  readonly selection = signal<VariantSelection>({
    kelvin: null,
    watt: null,
    color: null,
  });

  readonly galleryIndex = signal(0);
  readonly addedFeedback = signal(false);

  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly galleryImages = computed(() => {
    const product = this.product();
    return product ? getGalleryImages(product) : [];
  });

  readonly selectedVariant = computed(() => {
    const product = this.product();
    if (!product) {
      return null;
    }
    return findMatchingVariant(product.variants, this.selection()) ?? null;
  });

  readonly lightPair = computed(() => {
    const product = this.product();
    return product ? getGenuineLightPair(product) : null;
  });

  readonly applicationImages = computed(() => {
    const product = this.product();
    return product ? getApplicationImages(product) : [];
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        switchMap((slug) => {
          this.loading.set(true);
          this.error.set(null);
          this.galleryIndex.set(0);
          this.addedFeedback.set(false);
          this.relatedProducts.set([]);
          if (!slug) {
            this.product.set(null);
            this.loading.set(false);
            return of(null);
          }
          return this.catalog.getProductBySlug(slug);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loading.set(false);
          if (product) {
            this.selection.set(createInitialSelection(product.variants));
            this.catalog
              .getRelatedProducts(product.slug, 3)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (related) => this.relatedProducts.set(related),
              });
          }
        },
        error: () => {
          this.product.set(null);
          this.loading.set(false);
          this.error.set('Ürün yüklenemedi.');
        },
      });

    this.destroyRef.onDestroy(() => {
      if (this.feedbackTimer) {
        clearTimeout(this.feedbackTimer);
      }
    });
  }

  onSelectionChange(partial: Partial<VariantSelection>): void {
    const product = this.product();
    if (!product) {
      return;
    }
    const next = { ...this.selection(), ...partial };
    this.selection.set(resolveSelection(product.variants, next));
  }

  onGalleryIndexChange(index: number): void {
    this.galleryIndex.set(index);
  }

  onAddToCart(quantity: number): void {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant || variant.stock <= 0) {
      return;
    }

    const added = this.cart.addItem(product.id, variant.id, quantity);
    if (!added) {
      return;
    }

    this.addedFeedback.set(true);
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = setTimeout(() => {
      this.addedFeedback.set(false);
      this.feedbackTimer = null;
    }, 2200);
  }
}
