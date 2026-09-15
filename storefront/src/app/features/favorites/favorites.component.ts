import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Favoriler" />`,
})
export class FavoritesComponent {}
