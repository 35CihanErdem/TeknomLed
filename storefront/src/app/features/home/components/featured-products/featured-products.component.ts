import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ContainerComponent } from '../../../../shared/components/container/container.component';
import {
  HOME_PRODUCTS_INTRO,
  HomeProduct,
} from '../../data/home.content';
import { ProductCatalogService } from '../../../../core/catalog/product-catalog.service';
import { getTechnicalSummary } from '../../../products/utils/product-catalog.utils';
import { getPrimaryImage } from '../../../products/utils/product-catalog.utils';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RouterLink, ContainerComponent],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
})
export class FeaturedProductsComponent implements OnInit {
  private readonly catalog = inject(ProductCatalogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly intro = HOME_PRODUCTS_INTRO;
  readonly products = signal<HomeProduct[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.catalog
      .getFeaturedProducts(4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.products.set(
            items.map((product) => ({
              slug: product.slug,
              name: product.name,
              specs: getTechnicalSummary(product),
              image: getPrimaryImage(product),
            }))
          );
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
        },
      });
  }
}
