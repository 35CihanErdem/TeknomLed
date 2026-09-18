import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { ADMIN_NAV } from '../shared/admin-nav.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);
  readonly user = this.auth.currentUser;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly navGroups = computed(() => {
    // Re-evaluate when permissions change
    this.auth.permissions();
    return ADMIN_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => this.auth.canAny(...item.permissions)),
    })).filter((group) => group.items.length > 0);
  });

  readonly pageTitle = computed(() => {
    const current = this.url();
    for (const group of ADMIN_NAV) {
      for (const item of group.items) {
        if (
          item.path === '/admin'
            ? current === '/admin' || current === '/admin/'
            : current.startsWith(item.path)
        ) {
          return item.label;
        }
      }
    }
    return 'Admin';
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/account/login'),
      error: () => void this.router.navigateByUrl('/account/login'),
    });
  }
}
