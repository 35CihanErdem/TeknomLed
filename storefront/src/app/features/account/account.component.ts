import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Hesabım" />`,
})
export class AccountComponent {}
