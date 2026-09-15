import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { LightComparisonComponent } from '../../shared/components/light-comparison/light-comparison.component';
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';
import { ProductTechSummaryComponent } from './components/product-tech-summary/product-tech-summary.component';
import { ProductSpecificationsComponent } from './components/product-specifications/product-specifications.component';
import { ProductApplicationComponent } from './components/product-application/product-application.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import {
  VariantSelection,
  createInitialSelection,
  findMatchingVariant,
  findProductBySlug,
  getApplicationImages,
  getGalleryImages,
  getGenuineLightPair,
  getRelatedProducts,
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

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('slug') ?? '' }
  );

  readonly product = computed(() => {
    const slug = this.slug();
    return slug ? findProductBySlug(slug) ?? null : null;
  });

  readonly selection = signal<VariantSelection>({
    kelvin: null,
    watt: null,
    color: null,
  });

  readonly galleryIndex = signal(0);

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

  readonly relatedProducts = computed(() => {
    const product = this.product();
    return product ? getRelatedProducts(product, 3) : [];
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug') ?? '';
        const product = findProductBySlug(slug);
        this.galleryIndex.set(0);
        if (product) {
          this.selection.set(createInitialSelection(product.variants));
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

  /** Phase 5 will implement cart. Isolated placeholder only. */
  onAddToCart(): void {
    // Intentionally no CartService / localStorage / counter mutation.
  }
}
