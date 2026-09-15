import { Component, Input } from '@angular/core';
import { ProductImage } from '../../../products/models/product.model';

@Component({
  selector: 'app-product-application',
  standalone: true,
  templateUrl: './product-application.component.html',
  styleUrl: './product-application.component.scss',
})
export class ProductApplicationComponent {
  @Input({ required: true }) images!: ProductImage[];

  get primary(): ProductImage | undefined {
    return this.images[0];
  }

  get secondary(): ProductImage[] {
    return this.images.slice(1, 3);
  }
}
