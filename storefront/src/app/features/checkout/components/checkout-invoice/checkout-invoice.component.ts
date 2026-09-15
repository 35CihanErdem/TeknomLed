import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CheckoutAddressComponent } from '../checkout-address/checkout-address.component';
import { InvoiceType } from '../../models/checkout.model';
import { fieldErrorMessage } from '../../utils/checkout-validators';

@Component({
  selector: 'app-checkout-invoice',
  standalone: true,
  imports: [ReactiveFormsModule, CheckoutAddressComponent],
  templateUrl: './checkout-invoice.component.html',
  styleUrl: './checkout-invoice.component.scss',
})
export class CheckoutInvoiceComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() submitted = false;

  get sameAsShipping(): boolean {
    return !!this.form.get('sameAsShipping')?.value;
  }

  get type(): InvoiceType {
    return (this.form.get('type')?.value as InvoiceType) ?? 'individual';
  }

  get addressGroup(): FormGroup {
    return this.form.get('address') as FormGroup;
  }

  setType(type: InvoiceType): void {
    this.form.get('type')?.setValue(type);
  }

  error(name: string): string | null {
    return fieldErrorMessage(this.form.get(name), this.submitted);
  }
}
