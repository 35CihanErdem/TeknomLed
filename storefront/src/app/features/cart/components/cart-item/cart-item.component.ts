import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DetailedCartItem } from '../../models/cart.model';
import { formatPrice } from '../../../products/utils/product-catalog.utils';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
})
export class CartItemComponent {
  readonly item = input.required<DetailedCartItem>();

  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly remove = output<void>();

  formatPrice = formatPrice;
}
