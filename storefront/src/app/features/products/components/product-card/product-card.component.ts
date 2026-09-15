import { Component, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import {
  formatPriceFrom,
  getPrimaryImage,
  getStartingPrice,
  getTechnicalSummary,
} from '../../utils/product-catalog.utils';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent implements OnChanges {
  @Input({ required: true }) product!: Product;

  primaryImage = '';
  summary = '';
  priceLabel = '';
  imageAlt = '';

  ngOnChanges(): void {
    this.primaryImage = getPrimaryImage(this.product);
    this.summary = getTechnicalSummary(this.product);
    this.priceLabel = formatPriceFrom(getStartingPrice(this.product));
    this.imageAlt =
      this.product.images.find((i) => i.type === 'DEFAULT')?.alt ??
      this.product.name;
  }
}
