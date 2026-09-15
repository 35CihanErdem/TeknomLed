import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatPrice } from '../../../products/utils/product-catalog.utils';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart-summary.component.html',
  styleUrl: './cart-summary.component.scss',
})
export class CartSummaryComponent {
  readonly subtotal = input.required<number>();
  readonly isEmpty = input(true);

  formatPrice = formatPrice;
}
