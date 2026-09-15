import { Injectable } from '@angular/core';
import {
  CheckoutAddress,
  CheckoutDraft,
  EMPTY_ADDRESS,
  EMPTY_CHECKOUT_DRAFT,
  InvoiceType,
} from '../../features/checkout/models/checkout.model';
import { normalizeTrPhone } from '../../features/checkout/utils/checkout-validators';

const STORAGE_KEY = 'teknomled.storefront.checkout.v1';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeAddress(value: unknown): CheckoutAddress {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_ADDRESS };
  }
  const raw = value as Record<string, unknown>;
  return {
    firstName: asString(raw['firstName']),
    lastName: asString(raw['lastName']),
    company: asString(raw['company']),
    country: asString(raw['country'], 'Türkiye') || 'Türkiye',
    city: asString(raw['city']),
    district: asString(raw['district']),
    addressLine: asString(raw['addressLine']),
    postalCode: asString(raw['postalCode']),
  };
}

function sanitizeInvoiceType(value: unknown): InvoiceType {
  return value === 'corporate' ? 'corporate' : 'individual';
}

function sanitizeDraft(value: unknown): CheckoutDraft | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const contactRaw =
    raw['contact'] && typeof raw['contact'] === 'object'
      ? (raw['contact'] as Record<string, unknown>)
      : {};
  const invoiceRaw =
    raw['invoice'] && typeof raw['invoice'] === 'object'
      ? (raw['invoice'] as Record<string, unknown>)
      : {};
  const shipmentRaw =
    raw['shipment'] && typeof raw['shipment'] === 'object'
      ? (raw['shipment'] as Record<string, unknown>)
      : {};
  const paymentRaw =
    raw['payment'] && typeof raw['payment'] === 'object'
      ? (raw['payment'] as Record<string, unknown>)
      : {};

  return {
    contact: {
      email: asString(contactRaw['email']),
      phone: normalizeTrPhone(asString(contactRaw['phone'])),
    },
    shippingAddress: sanitizeAddress(raw['shippingAddress']),
    invoice: {
      sameAsShipping: asBoolean(invoiceRaw['sameAsShipping'], true),
      type: sanitizeInvoiceType(invoiceRaw['type']),
      firstName: asString(invoiceRaw['firstName']),
      lastName: asString(invoiceRaw['lastName']),
      identityNumber: asString(invoiceRaw['identityNumber']).replace(/\D/g, '').slice(0, 11),
      companyName: asString(invoiceRaw['companyName']),
      taxOffice: asString(invoiceRaw['taxOffice']),
      taxNumber: asString(invoiceRaw['taxNumber']).replace(/\D/g, '').slice(0, 10),
      address: sanitizeAddress(invoiceRaw['address']),
    },
    shipment: {
      methodId: asString(shipmentRaw['methodId'], 'standard') || 'standard',
    },
    payment: {
      method: asString(paymentRaw['method'], 'card_pending') || 'card_pending',
    },
  };
}

@Injectable({ providedIn: 'root' })
export class CheckoutDraftService {
  load(): CheckoutDraft {
    if (typeof localStorage === 'undefined') {
      return structuredClone(EMPTY_CHECKOUT_DRAFT);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return structuredClone(EMPTY_CHECKOUT_DRAFT);
      }
      const parsed: unknown = JSON.parse(raw);
      const draft = sanitizeDraft(parsed);
      return draft ? draft : structuredClone(EMPTY_CHECKOUT_DRAFT);
    } catch {
      return structuredClone(EMPTY_CHECKOUT_DRAFT);
    }
  }

  save(draft: CheckoutDraft): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const sanitized = sanitizeDraft(draft);
      if (!sanitized) {
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
}
