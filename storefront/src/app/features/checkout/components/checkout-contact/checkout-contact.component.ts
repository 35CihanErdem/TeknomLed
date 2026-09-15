import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  fieldErrorMessage,
  formatTrPhoneDisplay,
  normalizeTrPhone,
} from '../../utils/checkout-validators';

@Component({
  selector: 'app-checkout-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout-contact.component.html',
  styleUrl: './checkout-contact.component.scss',
})
export class CheckoutContactComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() submitted = false;

  error(name: string): string | null {
    return fieldErrorMessage(this.form.get(name), this.submitted);
  }

  onPhoneBlur(): void {
    const control = this.form.get('phone');
    if (!control) {
      return;
    }
    const normalized = normalizeTrPhone(String(control.value ?? ''));
    control.setValue(formatTrPhoneDisplay(normalized), { emitEvent: true });
  }
}
