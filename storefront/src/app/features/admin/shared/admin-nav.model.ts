import { Permission, PermissionName } from '../../../core/auth/permissions';

export interface AdminNavItem {
  label: string;
  path: string;
  permissions: PermissionName[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      {
        label: 'Özet',
        path: '/admin',
        permissions: [
          Permission.ProductView,
          Permission.ProductCreate,
          Permission.ProductUpdate,
          Permission.UserView,
          Permission.UserRoleUpdate,
        ],
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Products',
        path: '/admin/catalog/products',
        permissions: [Permission.ProductView],
      },
      {
        label: 'Categories',
        path: '/admin/catalog/categories',
        permissions: [Permission.ProductView],
      },
      {
        label: 'Application Areas',
        path: '/admin/catalog/application-areas',
        permissions: [Permission.ProductView],
      },
    ],
  },
  {
    label: 'Users',
    items: [
      {
        label: 'Users',
        path: '/admin/users',
        permissions: [Permission.UserView],
      },
    ],
  },
  {
    label: 'Access Management',
    items: [
      {
        label: 'Roles',
        path: '/admin/access/roles',
        permissions: [Permission.UserRoleUpdate],
      },
      {
        label: 'Permissions',
        path: '/admin/access/permissions',
        permissions: [Permission.UserRoleUpdate],
      },
    ],
  },
];
