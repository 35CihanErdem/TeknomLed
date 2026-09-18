import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guards';
import {
  adminAreaGuard,
  permissionGuard,
} from '../../core/auth/permission.guard';
import { Permission } from '../../core/auth/permissions';
import { unsavedChangesGuard } from '../../core/admin/unsaved-changes.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'access-denied',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./access-denied/admin-access-denied.component').then(
        (m) => m.AdminAccessDeniedComponent
      ),
    title: 'Access Denied | Admin',
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminAreaGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        title: 'Dashboard | Admin',
      },
      {
        path: 'catalog',
        redirectTo: 'catalog/products',
        pathMatch: 'full',
      },
      {
        path: 'catalog/products',
        canActivate: [permissionGuard(Permission.ProductView)],
        loadComponent: () =>
          import('./catalog/admin-products-page.component').then(
            (m) => m.AdminProductsPageComponent
          ),
        title: 'Products | Admin',
      },
      {
        path: 'catalog/products/new',
        canActivate: [permissionGuard(Permission.ProductCreate)],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./catalog/admin-product-editor-page.component').then(
            (m) => m.AdminProductEditorPageComponent
          ),
        title: 'New product | Admin',
      },
      {
        path: 'catalog/products/:id',
        canActivate: [permissionGuard(Permission.ProductView)],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./catalog/admin-product-editor-page.component').then(
            (m) => m.AdminProductEditorPageComponent
          ),
        title: 'Edit product | Admin',
      },
      {
        path: 'catalog/categories',
        canActivate: [permissionGuard(Permission.ProductView)],
        loadComponent: () =>
          import('./catalog/admin-categories-page.component').then(
            (m) => m.AdminCategoriesPageComponent
          ),
        title: 'Categories | Admin',
      },
      {
        path: 'catalog/application-areas',
        canActivate: [permissionGuard(Permission.ProductView)],
        loadComponent: () =>
          import('./catalog/admin-application-areas-page.component').then(
            (m) => m.AdminApplicationAreasPageComponent
          ),
        title: 'Application Areas | Admin',
      },
      {
        path: 'users',
        canActivate: [permissionGuard(Permission.UserView)],
        loadComponent: () =>
          import('./users/admin-users-page.component').then(
            (m) => m.AdminUsersPageComponent
          ),
        title: 'Users | Admin',
      },
      {
        path: 'access',
        redirectTo: 'access/roles',
        pathMatch: 'full',
      },
      {
        path: 'access/roles',
        canActivate: [permissionGuard(Permission.UserRoleUpdate)],
        loadComponent: () =>
          import('./access/admin-roles-page.component').then(
            (m) => m.AdminRolesPageComponent
          ),
        title: 'Roles | Admin',
      },
      {
        path: 'access/permissions',
        canActivate: [permissionGuard(Permission.UserRoleUpdate)],
        loadComponent: () =>
          import('./access/admin-permissions-page.component').then(
            (m) => m.AdminPermissionsPageComponent
          ),
        title: 'Permissions | Admin',
      },
    ],
  },
];
