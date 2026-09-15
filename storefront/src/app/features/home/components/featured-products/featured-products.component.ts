import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContainerComponent } from '../../../../shared/components/container/container.component';
import {
  HOME_PRODUCTS,
  HOME_PRODUCTS_INTRO,
  HomeProduct,
} from '../../data/home.content';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RouterLink, ContainerComponent],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
})
export class FeaturedProductsComponent {
  readonly intro = HOME_PRODUCTS_INTRO;
  readonly products: HomeProduct[] = HOME_PRODUCTS;
}
