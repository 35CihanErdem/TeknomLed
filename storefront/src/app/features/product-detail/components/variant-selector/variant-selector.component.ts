import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  KELVIN_LABELS,
  VariantSelection,
  isColorAvailable,
  isKelvinAvailable,
  isWattAvailable,
  uniqueColors,
  uniqueKelvins,
  uniqueWatts,
} from '../../utils/product-detail.utils';
import { ProductVariant } from '../../../products/models/product.model';

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  templateUrl: './variant-selector.component.html',
  styleUrl: './variant-selector.component.scss',
})
export class VariantSelectorComponent {
  @Input({ required: true }) variants!: ProductVariant[];
  @Input({ required: true }) selection!: VariantSelection;
  @Output() selectionChange = new EventEmitter<Partial<VariantSelection>>();

  readonly kelvinLabels = KELVIN_LABELS;

  get kelvins(): number[] {
    return uniqueKelvins(this.variants);
  }

  get watts(): number[] {
    return uniqueWatts(this.variants);
  }

  get colors(): string[] {
    return uniqueColors(this.variants);
  }

  get showKelvin(): boolean {
    return this.kelvins.length > 1;
  }

  get showWatt(): boolean {
    return this.watts.length > 1;
  }

  get showColor(): boolean {
    return this.colors.length > 1;
  }

  kelvinEnabled(kelvin: number): boolean {
    return isKelvinAvailable(this.variants, this.selection, kelvin);
  }

  wattEnabled(watt: number): boolean {
    return isWattAvailable(this.variants, this.selection, watt);
  }

  colorEnabled(color: string): boolean {
    return isColorAvailable(this.variants, this.selection, color);
  }

  selectKelvin(kelvin: number): void {
    if (!this.kelvinEnabled(kelvin)) {
      return;
    }
    this.selectionChange.emit({ kelvin });
  }

  selectWatt(watt: number): void {
    if (!this.wattEnabled(watt)) {
      return;
    }
    this.selectionChange.emit({ watt });
  }

  selectColor(color: string): void {
    if (!this.colorEnabled(color)) {
      return;
    }
    this.selectionChange.emit({ color });
  }
}
