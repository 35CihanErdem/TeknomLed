import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ContainerComponent } from '../container/container.component';

/**
 * Reusable LIGHT_OFF / LIGHT_ON comparison.
 * Requires two distinct, aligned image sources — never fake OFF with CSS filters.
 */
@Component({
  selector: 'app-light-comparison',
  standalone: true,
  imports: [ContainerComponent, NgTemplateOutlet],
  templateUrl: './light-comparison.component.html',
  styleUrl: './light-comparison.component.scss',
})
export class LightComparisonComponent {
  /** Base layer — lights off photograph */
  @Input({ required: true }) lightOffImage!: string;

  /** Clipped reveal layer — lights on photograph (same crop/camera as OFF) */
  @Input({ required: true }) lightOnImage!: string;

  @Input() imageAlt = 'Aydınlatma karşılaştırması';
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() beforeLabel = 'IŞIK KAPALI';
  @Input() afterLabel = 'IŞIK AÇIK';
  @Input() showHeader = true;
  /** When true, render only the comparison frame (Product Detail embedding). */
  @Input() embedded = false;

  readonly position = signal(50);

  @ViewChild('frame')
  private frameRef?: ElementRef<HTMLElement>;

  private dragging = false;

  onRangeInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.position.set(value);
  }

  onPointerDown(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('.comparison__range')) {
      return;
    }
    this.dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.updateFromClientX(event.clientX);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.updateFromClientX(event.clientX);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  @HostListener('window:pointerup')
  onWindowPointerUp(): void {
    this.dragging = false;
  }

  private updateFromClientX(clientX: number): void {
    const frame = this.frameRef?.nativeElement;
    if (!frame) {
      return;
    }
    const rect = frame.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    this.position.set(Math.round(Math.min(100, Math.max(0, ratio * 100))));
  }
}
