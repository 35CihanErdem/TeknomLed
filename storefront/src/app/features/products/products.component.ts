import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Ürünler" />`,
})
export class ProductsComponent {}
