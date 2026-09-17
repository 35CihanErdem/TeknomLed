import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, ContainerComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => void this.router.navigateByUrl('/'),
    });
  }
}
