import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { ContainerComponent } from '../../shared/components/container/container.component';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ContainerComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    '[class.header--overlay]': 'overlay()',
  },
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartService);

  readonly menuOpen = signal(false);
  readonly overlay = signal(this.isHomeUrl(this.router.url));
  readonly cartQuantity = this.cart.totalQuantity;

  readonly primaryNav: NavItem[] = [
    { label: 'Ürünler', path: '/products' },
    { label: 'Mekânlar', path: '/products' },
    { label: 'Projeler', path: '/projects' },
    { label: 'Hakkımızda', path: '/about' },
    { label: 'İletişim', path: '/contact' },
  ];

  readonly utilityNav: NavItem[] = [
    { label: 'Arama', path: '/search' },
    { label: 'Hesap', path: '/account' },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.overlay.set(this.isHomeUrl(event.urlAfterRedirects));
        this.menuOpen.set(false);
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private isHomeUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path === '/' || path === '';
  }
}
