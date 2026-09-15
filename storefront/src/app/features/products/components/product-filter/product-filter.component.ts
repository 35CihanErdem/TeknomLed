import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PowerRangeId,
  PriceRangeId,
  ProductFilterState,
} from '../../models/product.model';

@Component({
  selector: 'app-product-filter',
  standalone: true,
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.scss',
})
export class ProductFilterComponent {
  @Input({ required: true }) open!: boolean;
  @Input({ required: true }) filters!: ProductFilterState;
  @Input({ required: true }) applicationAreas!: readonly string[];
  @Input({ required: true }) kelvins!: readonly number[];
  @Input({ required: true }) ipClasses!: readonly string[];

  @Output() closed = new EventEmitter<void>();
  @Output() applicationToggle = new EventEmitter<string>();
  @Output() kelvinToggle = new EventEmitter<number>();
  @Output() powerToggle = new EventEmitter<PowerRangeId>();
  @Output() ipToggle = new EventEmitter<string>();
  @Output() priceToggle = new EventEmitter<PriceRangeId>();
  @Output() clearAll = new EventEmitter<void>();

  readonly powerOptions: { id: PowerRangeId; label: string }[] = [
    { id: '0-10', label: '0–10W' },
    { id: '11-20', label: '11–20W' },
    { id: '21-40', label: '21–40W' },
    { id: '40+', label: '40W+' },
  ];

  readonly priceOptions: { id: PriceRangeId; label: string }[] = [
    { id: '0-1000', label: '0–1.000 TL' },
    { id: '1000-2500', label: '1.000–2.500 TL' },
    { id: '2500-5000', label: '2.500–5.000 TL' },
    { id: '5000+', label: '5.000 TL+' },
  ];

  isActive(list: Array<string | number>, value: string | number): boolean {
    return list.includes(value);
  }
}
