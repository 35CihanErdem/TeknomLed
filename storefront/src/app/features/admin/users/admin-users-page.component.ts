import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Users"
      description="Kullanıcı listesi ve rol atama UI’si. Backend’de admin user endpoints henüz yok."
      phaseNote="Phase 9D — user listing, details, role assign/remove APIs required"
    />
  `,
})
export class AdminUsersPageComponent {}
