import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Products"
      description="Ürün listesi ve düzenleme arayüzü burada olacak. Sahte ürün listesi gösterilmez."
      phaseNote="Phase 9B — Admin catalog CRUD UI"
    />
  `,
})
export class AdminProductsPageComponent {}
