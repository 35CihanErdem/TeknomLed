import { Component } from '@angular/core';
import { AdminSectionPlaceholderComponent } from '../shared/admin-section-placeholder.component';

@Component({
  selector: 'app-admin-roles-page',
  standalone: true,
  imports: [AdminSectionPlaceholderComponent],
  template: `
    <app-admin-section-placeholder
      title="Roles"
      description="Rol listesi ve rol-izin eşlemesi. Seed’lenmiş roller var; yönetim API’si yok."
      phaseNote="Phase 9D — role listing and role-permission management APIs required"
    />
  `,
})
export class AdminRolesPageComponent {}
