import { Component, Input } from '@angular/core';
import { Product } from '../../../products/models/product.model';
import { ProductCardComponent } from '../../../products/components/product-card/product-card.component';
import { ContainerComponent } from '../../../../shared/components/container/container.component';

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [ProductCardComponent, ContainerComponent],
  templateUrl: './related-products.component.html',
  styleUrl: './related-products.component.scss',
})
export class RelatedProductsComponent {
  @Input({ required: true }) products!: Product[];
}
