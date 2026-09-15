import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DetailedCartItem } from '../../../cart/models/cart.model';
import { formatPrice } from '../../../products/utils/product-catalog.utils';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './checkout-summary.component.html',
  styleUrl: './checkout-summary.component.scss',
})
export class CheckoutSummaryComponent {
  readonly items = input.required<DetailedCartItem[]>();
  readonly subtotal = input.required<number>();

  formatPrice = formatPrice;
}
