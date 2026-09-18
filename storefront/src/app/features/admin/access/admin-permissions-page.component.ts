import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-permissions-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Permissions"
      description="Sistem izinlerinin listelenmesi. Domain sabitleri ve seed mevcut; public admin API yok."
      phaseNote="Phase 9D — permission listing API required"
    />
  `,
})
export class AdminPermissionsPageComponent {}
