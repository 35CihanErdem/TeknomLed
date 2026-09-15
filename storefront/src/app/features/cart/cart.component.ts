import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { CartSummaryComponent } from './components/cart-summary/cart-summary.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    RouterLink,
    ContainerComponent,
    CartItemComponent,
    CartSummaryComponent,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  private readonly cart = inject(CartService);

  readonly items = this.cart.detailedItems;
  readonly totalQuantity = this.cart.totalQuantity;
  readonly lineCount = this.cart.lineCount;
  readonly subtotal = this.cart.subtotal;
  readonly isEmpty = this.cart.isEmpty;

  increment(productId: string, variantId: string): void {
    this.cart.increment(productId, variantId);
  }

  decrement(productId: string, variantId: string): void {
    this.cart.decrement(productId, variantId);
  }

  remove(productId: string, variantId: string): void {
    this.cart.removeItem(productId, variantId);
  }

  clearCart(): void {
    if (this.isEmpty()) {
      return;
    }
    const confirmed = window.confirm(
      'Sepetinizdeki tüm ürünler kaldırılacak. Devam etmek istiyor musunuz?'
    );
    if (confirmed) {
      this.cart.clearCart();
    }
  }
}
