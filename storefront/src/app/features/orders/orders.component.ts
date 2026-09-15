import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Siparişlerim" />`,
})
export class OrdersComponent {}
