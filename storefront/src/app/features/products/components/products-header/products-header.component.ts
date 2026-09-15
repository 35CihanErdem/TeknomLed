import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-products-header',
  standalone: true,
  templateUrl: './products-header.component.html',
  styleUrl: './products-header.component.scss',
})
export class ProductsHeaderComponent {
  @Input() eyebrow = 'KOLEKSİYON';
  @Input() headingLines: string[] = ['Mekânınız için', 'doğru ışığı bulun.'];
  @Input() supportingText =
    'Mimari, peyzaj ve profesyonel uygulamalar için geliştirilen aydınlatma çözümlerini keşfedin.';
}
