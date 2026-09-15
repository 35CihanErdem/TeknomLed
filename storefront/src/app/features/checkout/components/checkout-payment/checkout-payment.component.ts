import { Component } from '@angular/core';

/**
 * Payment UI is integration-ready only.
 * Frontend will NEVER decide that an order is paid.
 * Future flow: Angular → ASP.NET Core → payment provider →
 * provider webhook → backend verifies → order becomes PAID.
 */
@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  templateUrl: './checkout-payment.component.html',
  styleUrl: './checkout-payment.component.scss',
})
export class CheckoutPaymentComponent {}
