import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss',
})
export class ProductGridComponent {
  @Input({ required: true }) products!: Product[];
  @Output() clearFilters = new EventEmitter<void>();
}
