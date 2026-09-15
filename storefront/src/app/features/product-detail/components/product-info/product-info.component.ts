import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
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
export class ProductInfoComponent implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) selection!: VariantSelection;
  @Input() selectedVariant: ProductVariant | null = null;
  @Input() addedFeedback = false;
  @Output() selectionChange = new EventEmitter<Partial<VariantSelection>>();
  @Output() addToCart = new EventEmitter<number>();

  quantity = 1;

  formatPrice = formatPrice;
  getStockLabel = getStockLabel;

  get outOfStock(): boolean {
    return (this.selectedVariant?.stock ?? 0) <= 0;
  }

  get maxQuantity(): number {
    return Math.max(this.selectedVariant?.stock ?? 1, 1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedVariant']) {
      this.clampQuantity();
    }
  }

  decreaseQuantity(): void {
    if (this.quantity <= 1) {
      return;
    }
    this.quantity -= 1;
  }

  increaseQuantity(): void {
    if (this.quantity >= this.maxQuantity) {
      return;
    }
    this.quantity += 1;
  }

  submitAddToCart(): void {
    if (this.outOfStock) {
      return;
    }
    this.clampQuantity();
    this.addToCart.emit(this.quantity);
  }

  private clampQuantity(): void {
    const max = this.maxQuantity;
    if (this.quantity > max) {
      this.quantity = max;
    }
    if (this.quantity < 1) {
      this.quantity = 1;
    }
  }
}
