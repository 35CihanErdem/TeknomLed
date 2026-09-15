import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Ürün detayı" />`,
})
export class ProductDetailComponent {}
