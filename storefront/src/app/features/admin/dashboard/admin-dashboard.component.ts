import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission } from '../../../core/auth/permissions';

interface AdminSection {
  title: string;
  description: string;
  path: string;
  cta: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private readonly auth = inject(AuthService);

  private readonly allSections: AdminSection[] = [
    {
      title: 'Catalog Management',
      description:
        'Ürünler, kategoriler ve uygulama alanlarını yönetin.',
      path: '/admin/catalog/products',
      cta: 'Kataloğa git',
      permissions: [Permission.ProductView],
    },
    {
      title: 'User Management',
      description:
        'Kullanıcı listesi ve hesap durumu. Listeleme API’leri Phase 9D’de eklenecek.',
      path: '/admin/users',
      cta: 'Kullanıcılara git',
      permissions: [Permission.UserView],
    },
    {
      title: 'Access Management',
      description:
        'Roller ve izin atamaları. Yönetim API’leri Phase 9D’de eklenecek.',
      path: '/admin/access/roles',
      cta: 'Erişim yönetimine git',
      permissions: [Permission.UserRoleUpdate],
    },
  ];

  readonly sections = computed(() => {
    this.auth.permissions();
    return this.allSections.filter((section) =>
      this.auth.canAny(...section.permissions)
    );
  });
}
