import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  signal,
} from '@angular/core';
import { ContainerComponent } from '../../../../shared/components/container/container.component';
import { HOME_COMPARISON } from '../../data/home.content';

@Component({
  selector: 'app-light-comparison',
  standalone: true,
  imports: [ContainerComponent],
  templateUrl: './light-comparison.component.html',
  styleUrl: './light-comparison.component.scss',
})
export class LightComparisonComponent {
  /** Lights-off base scene — replace with production LIGHT_OFF asset. */
  @Input() lightOffImage = HOME_COMPARISON.lightOffImage;

  /** Lights-on reveal scene — replace with aligned LIGHT_ON asset. */
  @Input() lightOnImage = HOME_COMPARISON.lightOnImage;

  @Input() imageAlt = HOME_COMPARISON.imageAlt;
  @Input() eyebrow = HOME_COMPARISON.eyebrow;
  @Input() title = HOME_COMPARISON.title;
  @Input() description = HOME_COMPARISON.description;
  @Input() beforeLabel = HOME_COMPARISON.beforeLabel;
  @Input() afterLabel = HOME_COMPARISON.afterLabel;

  readonly position = signal(52);

  @ViewChild('frame', { static: true })
  private frameRef!: ElementRef<HTMLElement>;

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
    const rect = this.frameRef.nativeElement.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    this.position.set(Math.round(Math.min(100, Math.max(0, ratio * 100))));
  }
}
