import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContainerComponent } from '../../../shared/components/container/container.component';
import { AuthService } from '../../../core/auth/auth.service';
import {
  formatTrPhoneDisplay,
  normalizeTrPhone,
  trPhoneValidator,
} from '../../checkout/utils/checkout-validators';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [ReactiveFormsModule, ContainerComponent],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss',
})
export class CompleteProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    phone: ['', [trPhoneValidator()]],
  });

  submit(): void {
    this.errorMessage.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const phone = normalizeTrPhone(this.form.controls.phone.value);
    this.auth.updateProfile({ phone }).subscribe({
      next: () => {
        this.submitting.set(false);
        const returnUrl = this.auth.sanitizeReturnUrl(
          this.route.snapshot.queryParamMap.get('returnUrl')
        );
        void this.router.navigateByUrl(returnUrl ?? '/account');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          this.auth.extractErrorMessage(err, 'Profil güncellenemedi.')
        );
      },
    });
  }

  onPhoneBlur(): void {
    const control = this.form.controls.phone;
    const normalized = normalizeTrPhone(control.value);
    control.setValue(formatTrPhoneDisplay(normalized));
  }
}
