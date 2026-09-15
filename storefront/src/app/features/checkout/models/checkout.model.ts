export type InvoiceType = 'individual' | 'corporate';

export interface CheckoutContact {
  email: string;
  phone: string;
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
}

export interface CheckoutInvoice {
  sameAsShipping: boolean;
  type: InvoiceType;
  firstName: string;
  lastName: string;
  identityNumber: string;
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  address: CheckoutAddress;
}

export interface CheckoutShipment {
  methodId: string;
}

export interface CheckoutPayment {
  method: string;
}

export interface CheckoutDraft {
  contact: CheckoutContact;
  shippingAddress: CheckoutAddress;
  invoice: CheckoutInvoice;
  shipment: CheckoutShipment;
  payment: CheckoutPayment;
}

export const EMPTY_ADDRESS: CheckoutAddress = {
  firstName: '',
  lastName: '',
  company: '',
  country: 'Türkiye',
  city: '',
  district: '',
  addressLine: '',
  postalCode: '',
};

export const EMPTY_CHECKOUT_DRAFT: CheckoutDraft = {
  contact: {
    email: '',
    phone: '',
  },
  shippingAddress: { ...EMPTY_ADDRESS },
  invoice: {
    sameAsShipping: true,
    type: 'individual',
    firstName: '',
    lastName: '',
    identityNumber: '',
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    address: { ...EMPTY_ADDRESS },
  },
  shipment: {
    methodId: 'standard',
  },
  payment: {
    method: 'card_pending',
  },
};
