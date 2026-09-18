import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-product-editor-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Product editor"
      description="Yeni ürün / ürün düzenleme formu Phase 9B’de bağlanacak. Variant, specification ve media yönetimi de o fazda."
      phaseNote="Phase 9B — requires extended admin catalog APIs (list/get by id, application-area admin, media/spec endpoints)"
    />
  `,
})
export class AdminProductEditorPageComponent {}
