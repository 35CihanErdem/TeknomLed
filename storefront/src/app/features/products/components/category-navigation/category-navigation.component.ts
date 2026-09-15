import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductCategory } from '../../models/product.model';

@Component({
  selector: 'app-category-navigation',
  standalone: true,
  templateUrl: './category-navigation.component.html',
  styleUrl: './category-navigation.component.scss',
})
export class CategoryNavigationComponent {
  @Input({ required: true }) categories!: ProductCategory[];
  @Input() activeSlug: string | null = null;
  @Output() categoryChange = new EventEmitter<string | null>();

  select(slug: string | null): void {
    this.categoryChange.emit(slug);
  }
}
