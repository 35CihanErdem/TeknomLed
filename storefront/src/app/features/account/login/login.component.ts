import { Component, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContainerComponent } from '../../../shared/components/container/container.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleAuthService } from '../../../core/auth/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ContainerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('googleButton', { static: true }) googleButton?: ElementRef<HTMLElement>;

  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const host = this.googleButton?.nativeElement;
    if (!host) {
      return;
    }
    void this.googleAuth
      .renderButton(host, (credential) => this.onGoogleCredential(credential))
      .catch(() => {
        host.innerHTML =
          '<p class="google-placeholder">Google girişi şu an kullanılamıyor.</p>';
      });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    this.errorMessage.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.auth.handlePostLoginNavigation(user, this.returnUrl);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          this.auth.extractErrorMessage(err, 'E-posta veya şifre hatalı.')
        );
      },
    });
  }

  private onGoogleCredential(credential: string): void {
    this.errorMessage.set(null);
    this.submitting.set(true);
    this.auth.loginWithGoogle(credential).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.auth.handlePostLoginNavigation(user, this.returnUrl);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          this.auth.extractErrorMessage(err, 'Google ile giriş başarısız.')
        );
      },
    });
  }

  get returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }
}
