import { Component, Input } from '@angular/core';
import { Product, ProductVariant } from '../../../products/models/product.model';

interface SpecRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-product-specifications',
  standalone: true,
  templateUrl: './product-specifications.component.html',
  styleUrl: './product-specifications.component.scss',
})
export class ProductSpecificationsComponent {
  @Input({ required: true }) product!: Product;
  @Input() variant: ProductVariant | null = null;

  get rows(): SpecRow[] {
    const variant = this.variant;
    const specs = this.product.specifications;
    const rows: SpecRow[] = [];

    if (variant?.sku) {
      rows.push({ label: 'SKU', value: variant.sku });
    }
    if (variant?.watt != null) {
      rows.push({ label: 'Güç', value: `${variant.watt}W` });
    }
    if (variant?.lumen != null) {
      rows.push({
        label: 'Işık Akısı',
        value: `${variant.lumen.toLocaleString('tr-TR')} lm`,
      });
    }
    if (variant?.kelvin != null) {
      rows.push({ label: 'Renk Sıcaklığı', value: `${variant.kelvin}K` });
    }
    if (specs.ip) {
      rows.push({ label: 'Koruma Sınıfı', value: specs.ip });
    }
    if (variant?.dimensions) {
      rows.push({ label: 'Ölçüler', value: variant.dimensions });
    }
    if (variant?.color) {
      rows.push({ label: 'Gövde Rengi', value: variant.color });
    }
    if (specs.material) {
      rows.push({ label: 'Malzeme', value: specs.material });
    }
    if (specs.voltage) {
      rows.push({ label: 'Gerilim', value: specs.voltage });
    }
    if (specs.beamAngle) {
      rows.push({ label: 'Işık Açısı', value: specs.beamAngle });
    }
    if (specs.mounting) {
      rows.push({ label: 'Montaj', value: specs.mounting });
    }

    return rows;
  }
}
