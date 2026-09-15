import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Normalize TR mobile to 10 digits starting with 5 when possible. */
export function normalizeTrPhone(value: string): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

export function formatTrPhoneDisplay(normalized: string): string {
  const d = normalizeTrPhone(normalized);
  if (!d) {
    return '';
  }
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 8);
  const p4 = d.slice(8, 10);
  let out = '+90';
  if (p1) out += ` ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  return out;
}

export function isValidTrMobile(value: string): boolean {
  return /^5\d{9}$/.test(normalizeTrPhone(value));
}

export function trPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return { required: true };
    }
    return isValidTrMobile(raw) ? null : { phone: true };
  };
}

export function tcIdentityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return { required: true };
    }
    return /^\d{11}$/.test(raw) ? null : { identity: true };
  };
}

export function taxNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return { required: true };
    }
    return /^\d{10}$/.test(raw) ? null : { taxNumber: true };
  };
}

export function fieldErrorMessage(
  control: AbstractControl | null,
  submitted: boolean
): string | null {
  if (!control) {
    return null;
  }
  if (!(control.touched || submitted) || !control.errors) {
    return null;
  }
  if (control.errors['required']) {
    return 'Bu alan zorunludur.';
  }
  if (control.errors['email']) {
    return 'Geçerli bir e-posta adresi girin.';
  }
  if (control.errors['phone']) {
    return 'Geçerli bir telefon numarası girin.';
  }
  if (control.errors['identity']) {
    return '11 haneli T.C. Kimlik No girin.';
  }
  if (control.errors['taxNumber']) {
    return '10 haneli vergi numarası girin.';
  }
  return 'Bu alan geçersiz.';
}
