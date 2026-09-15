import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product, ProductVariant } from '../../../products/models/product.model';
import { VariantSelectorComponent } from '../variant-selector/variant-selector.component';
import { VariantSelection, getStockLabel } from '../../utils/product-detail.utils';
import { formatPrice } from '../../../products/utils/product-catalog.utils';

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [VariantSelectorComponent],
  templateUrl: './product-info.component.html',
  styleUrl: './product-info.component.scss',
})
export class ProductInfoComponent {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) selection!: VariantSelection;
  @Input() selectedVariant: ProductVariant | null = null;
  @Output() selectionChange = new EventEmitter<Partial<VariantSelection>>();
  @Output() addToCart = new EventEmitter<void>();

  formatPrice = formatPrice;
  getStockLabel = getStockLabel;

  get outOfStock(): boolean {
    return (this.selectedVariant?.stock ?? 0) <= 0;
  }
}
