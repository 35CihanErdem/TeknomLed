import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductImage } from '../../../products/models/product.model';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  templateUrl: './product-gallery.component.html',
  styleUrl: './product-gallery.component.scss',
})
export class ProductGalleryComponent {
  @Input({ required: true }) images!: ProductImage[];
  @Input({ required: true }) activeIndex!: number;
  @Output() activeIndexChange = new EventEmitter<number>();

  select(index: number): void {
    this.activeIndexChange.emit(index);
  }

  get active(): ProductImage | undefined {
    return this.images[this.activeIndex] ?? this.images[0];
  }
}
