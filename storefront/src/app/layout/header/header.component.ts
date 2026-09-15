import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
})
export class HeaderComponent {
  readonly menuOpen = signal(false);

  readonly primaryNav: NavItem[] = [
    { label: 'Ürünler', path: '/products' },
    { label: 'Projeler', path: '/projects' },
    { label: 'Hakkımızda', path: '/about' },
    { label: 'İletişim', path: '/contact' },
  ];

  readonly utilityNav: NavItem[] = [
    { label: 'Arama', path: '/search' },
    { label: 'Favoriler', path: '/favorites' },
    { label: 'Sepet', path: '/cart' },
    { label: 'Hesap', path: '/account' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
