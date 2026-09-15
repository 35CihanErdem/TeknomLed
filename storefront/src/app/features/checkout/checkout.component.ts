import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { CheckoutDraftService } from '../../core/services/checkout-draft.service';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { CheckoutAddressComponent } from './components/checkout-address/checkout-address.component';
import { CheckoutContactComponent } from './components/checkout-contact/checkout-contact.component';
import { CheckoutInvoiceComponent } from './components/checkout-invoice/checkout-invoice.component';
import { CheckoutPaymentComponent } from './components/checkout-payment/checkout-payment.component';
import { CheckoutShippingComponent } from './components/checkout-shipping/checkout-shipping.component';
import { CheckoutSummaryComponent } from './components/checkout-summary/checkout-summary.component';
import {
  CheckoutAddress,
  CheckoutDraft,
  EMPTY_ADDRESS,
} from './models/checkout.model';
import {
  formatTrPhoneDisplay,
  normalizeTrPhone,
  taxNumberValidator,
  tcIdentityValidator,
  trPhoneValidator,
} from './utils/checkout-validators';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ContainerComponent,
    CheckoutContactComponent,
    CheckoutAddressComponent,
    CheckoutInvoiceComponent,
    CheckoutShippingComponent,
    CheckoutPaymentComponent,
    CheckoutSummaryComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cart = inject(CartService);
  private readonly draftService = inject(CheckoutDraftService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly items = this.cart.detailedItems;
  readonly subtotal = this.cart.subtotal;
  readonly isEmpty = this.cart.isEmpty;

  readonly submitted = signal(false);
  readonly integrationNotice = signal(false);

  readonly form = this.fb.group({
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [trPhoneValidator()]],
    }),
    shippingAddress: this.createAddressGroup(),
    invoice: this.fb.group({
      sameAsShipping: [true],
      type: this.fb.nonNullable.control<'individual' | 'corporate'>('individual'),
      firstName: [''],
      lastName: [''],
      identityNumber: [''],
      companyName: [''],
      taxOffice: [''],
      taxNumber: [''],
      address: this.createAddressGroup(),
    }),
    shipment: this.fb.group({
      methodId: this.fb.nonNullable.control('standard'),
    }),
    payment: this.fb.group({
      method: this.fb.nonNullable.control('card_pending'),
    }),
  });

  constructor() {
    const draft = this.draftService.load();
    this.patchFromDraft(draft);
    this.syncInvoiceValidators();

    this.form.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.draftService.save(this.toDraft());
      });

    this.invoiceGroup
      .get('sameAsShipping')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncInvoiceValidators());

    this.invoiceGroup
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncInvoiceValidators());
  }

  get contactGroup(): FormGroup {
    return this.form.get('contact') as FormGroup;
  }

  get shippingAddressGroup(): FormGroup {
    return this.form.get('shippingAddress') as FormGroup;
  }

  get invoiceGroup(): FormGroup {
    return this.form.get('invoice') as FormGroup;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.integrationNotice.set(false);
    this.syncInvoiceValidators();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.scrollToFirstInvalid();
      return;
    }

    // No backend / payment provider yet — validate only, do not create an order.
    this.draftService.save(this.toDraft());
    this.integrationNotice.set(true);
  }

  private createAddressGroup(address: CheckoutAddress = EMPTY_ADDRESS): FormGroup {
    return this.fb.group({
      firstName: [address.firstName, Validators.required],
      lastName: [address.lastName, Validators.required],
      company: [address.company],
      country: [address.country || 'Türkiye', Validators.required],
      city: [address.city, Validators.required],
      district: [address.district, Validators.required],
      addressLine: [address.addressLine, Validators.required],
      postalCode: [address.postalCode],
    });
  }

  private patchFromDraft(draft: CheckoutDraft): void {
    const phoneDisplay = draft.contact.phone
      ? formatTrPhoneDisplay(draft.contact.phone)
      : '';

    this.form.patchValue(
      {
        contact: {
          email: draft.contact.email,
          phone: phoneDisplay,
        },
        shippingAddress: draft.shippingAddress,
        invoice: {
          sameAsShipping: draft.invoice.sameAsShipping,
          type: draft.invoice.type,
          firstName: draft.invoice.firstName,
          lastName: draft.invoice.lastName,
          identityNumber: draft.invoice.identityNumber,
          companyName: draft.invoice.companyName,
          taxOffice: draft.invoice.taxOffice,
          taxNumber: draft.invoice.taxNumber,
          address: draft.invoice.address,
        },
        shipment: draft.shipment,
        payment: draft.payment,
      },
      { emitEvent: false }
    );
  }

  private toDraft(): CheckoutDraft {
    const raw = this.form.getRawValue();
    return {
      contact: {
        email: String(raw.contact.email ?? ''),
        phone: normalizeTrPhone(String(raw.contact.phone ?? '')),
      },
      shippingAddress: {
        ...EMPTY_ADDRESS,
        ...raw.shippingAddress,
      },
      invoice: {
        sameAsShipping: !!raw.invoice.sameAsShipping,
        type: raw.invoice.type === 'corporate' ? 'corporate' : 'individual',
        firstName: String(raw.invoice.firstName ?? ''),
        lastName: String(raw.invoice.lastName ?? ''),
        identityNumber: String(raw.invoice.identityNumber ?? '')
          .replace(/\D/g, '')
          .slice(0, 11),
        companyName: String(raw.invoice.companyName ?? ''),
        taxOffice: String(raw.invoice.taxOffice ?? ''),
        taxNumber: String(raw.invoice.taxNumber ?? '')
          .replace(/\D/g, '')
          .slice(0, 10),
        address: {
          ...EMPTY_ADDRESS,
          ...raw.invoice.address,
        },
      },
      shipment: {
        methodId: String(raw.shipment.methodId ?? 'standard'),
      },
      payment: {
        method: String(raw.payment.method ?? 'card_pending'),
      },
    };
  }

  private syncInvoiceValidators(): void {
    const invoice = this.invoiceGroup;
    const type = invoice.get('type')?.value;
    const sameAsShipping = !!invoice.get('sameAsShipping')?.value;
    const address = invoice.get('address') as FormGroup;

    const firstName = invoice.get('firstName');
    const lastName = invoice.get('lastName');
    const identityNumber = invoice.get('identityNumber');
    const companyName = invoice.get('companyName');
    const taxOffice = invoice.get('taxOffice');
    const taxNumber = invoice.get('taxNumber');

    firstName?.clearValidators();
    lastName?.clearValidators();
    identityNumber?.clearValidators();
    companyName?.clearValidators();
    taxOffice?.clearValidators();
    taxNumber?.clearValidators();

    if (type === 'individual') {
      firstName?.setValidators([Validators.required]);
      lastName?.setValidators([Validators.required]);
      identityNumber?.setValidators([tcIdentityValidator()]);
    } else {
      companyName?.setValidators([Validators.required]);
      taxOffice?.setValidators([Validators.required]);
      taxNumber?.setValidators([taxNumberValidator()]);
    }

    firstName?.updateValueAndValidity({ emitEvent: false });
    lastName?.updateValueAndValidity({ emitEvent: false });
    identityNumber?.updateValueAndValidity({ emitEvent: false });
    companyName?.updateValueAndValidity({ emitEvent: false });
    taxOffice?.updateValueAndValidity({ emitEvent: false });
    taxNumber?.updateValueAndValidity({ emitEvent: false });

    const addressControls = [
      'firstName',
      'lastName',
      'country',
      'city',
      'district',
      'addressLine',
    ] as const;

    for (const key of addressControls) {
      const control = address.get(key);
      if (!control) {
        continue;
      }
      if (sameAsShipping) {
        control.clearValidators();
      } else {
        control.setValidators([Validators.required]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private scrollToFirstInvalid(): void {
    const invalid = this.host.nativeElement.querySelector(
      'input.ng-invalid, textarea.ng-invalid, select.ng-invalid'
    ) as HTMLElement | null;

    if (!invalid) {
      return;
    }

    invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    invalid.focus({ preventScroll: true });
  }
}
