import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'TeknomLed',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then(
            (m) => m.ProductsComponent
          ),
        title: 'Ürünler | TeknomLed',
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          ),
        title: 'Ürün | TeknomLed',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects.component').then(
            (m) => m.ProjectsComponent
          ),
        title: 'Projeler | TeknomLed',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then((m) => m.AboutComponent),
        title: 'Hakkımızda | TeknomLed',
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then(
            (m) => m.ContactComponent
          ),
        title: 'İletişim | TeknomLed',
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search.component').then(
            (m) => m.SearchComponent
          ),
        title: 'Arama | TeknomLed',
      },
      {
        path: 'favorites',
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(
            (m) => m.FavoritesComponent
          ),
        title: 'Favoriler | TeknomLed',
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart.component').then((m) => m.CartComponent),
        title: 'Sepet | TeknomLed',
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          ),
        title: 'Ödeme | TeknomLed',
      },
      {
        path: 'account/login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/account/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Giriş | TeknomLed',
      },
      {
        path: 'account/register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/account/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Kayıt | TeknomLed',
      },
      {
        path: 'account/complete-profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/complete-profile/complete-profile.component').then(
            (m) => m.CompleteProfileComponent
          ),
        title: 'Profili Tamamla | TeknomLed',
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/account.component').then(
            (m) => m.AccountComponent
          ),
        title: 'Hesabım | TeknomLed',
      },
      {
        path: 'account/orders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
        title: 'Siparişlerim | TeknomLed',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
