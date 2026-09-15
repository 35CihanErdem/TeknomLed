import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductSortOption } from '../../models/product.model';

@Component({
  selector: 'app-product-toolbar',
  standalone: true,
  templateUrl: './product-toolbar.component.html',
  styleUrl: './product-toolbar.component.scss',
})
export class ProductToolbarComponent {
  @Input({ required: true }) resultCount!: number;
  @Input() sort: ProductSortOption = 'recommended';
  @Input() filterOpen = false;
  @Output() filterToggle = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<ProductSortOption>();

  readonly sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'recommended', label: 'Önerilen' },
    { value: 'price-asc', label: 'Fiyat: Artan' },
    { value: 'price-desc', label: 'Fiyat: Azalan' },
    { value: 'name-asc', label: 'İsim: A-Z' },
  ];

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ProductSortOption;
    this.sortChange.emit(value);
  }
}
