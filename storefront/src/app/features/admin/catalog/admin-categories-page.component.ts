import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Categories"
      description="Kategori yönetimi arayüzü. Create/Update API mevcut; listeleme ve admin UI Phase 9B’de."
      phaseNote="Phase 9B"
    />
  `,
})
export class AdminCategoriesPageComponent {}
