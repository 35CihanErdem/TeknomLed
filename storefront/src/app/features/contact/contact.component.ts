import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="İletişim" />`,
})
export class ContactComponent {}
