import { Component, Input } from '@angular/core';
import { ContainerComponent } from '../../../shared/components/container/container.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [ContainerComponent],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
})
export class PlaceholderPageComponent {
  @Input({ required: true }) title!: string;
  @Input() description = 'Bu sayfa sonraki aşamalarda geliştirilecek.';
}
