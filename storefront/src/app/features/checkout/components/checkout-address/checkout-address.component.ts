import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { fieldErrorMessage } from '../../utils/checkout-validators';

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout-address.component.html',
  styleUrl: './checkout-address.component.scss',
})
export class CheckoutAddressComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() submitted = false;
  @Input() title = 'Teslimat Adresi';
  @Input() idPrefix = 'ship';

  error(name: string): string | null {
    return fieldErrorMessage(this.form.get(name), this.submitted);
  }
}
