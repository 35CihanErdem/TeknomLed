import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-application-areas-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Application Areas"
      description="Uygulama alanı yönetimi. Public GET mevcut; admin create/update API’si henüz yok."
      phaseNote="Phase 9B — missing admin application-area endpoints"
    />
  `,
})
export class AdminApplicationAreasPageComponent {}
