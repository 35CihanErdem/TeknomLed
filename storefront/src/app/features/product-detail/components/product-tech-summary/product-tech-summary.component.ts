import { Component, Input } from '@angular/core';
import { Product, ProductVariant } from '../../../products/models/product.model';

interface TechItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-product-tech-summary',
  standalone: true,
  templateUrl: './product-tech-summary.component.html',
  styleUrl: './product-tech-summary.component.scss',
})
export class ProductTechSummaryComponent {
  @Input({ required: true }) product!: Product;
  @Input() variant: ProductVariant | null = null;

  get items(): TechItem[] {
    const variant = this.variant;
    const items: TechItem[] = [];

    if (variant?.watt != null) {
      items.push({ label: 'Güç', value: `${variant.watt}W` });
    }
    if (variant?.lumen != null) {
      items.push({
        label: 'Işık Akısı',
        value: `${variant.lumen.toLocaleString('tr-TR')} lm`,
      });
    }
    if (variant?.kelvin != null) {
      items.push({ label: 'Renk Sıcaklığı', value: `${variant.kelvin}K` });
    }
    if (this.product.specifications.ip) {
      items.push({
        label: 'Koruma',
        value: this.product.specifications.ip,
      });
    }

    return items;
  }
}
