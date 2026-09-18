import { Injectable } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) {
    return true;
  }
  return window.confirm(
    'Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istiyor musunuz?'
  );
};
