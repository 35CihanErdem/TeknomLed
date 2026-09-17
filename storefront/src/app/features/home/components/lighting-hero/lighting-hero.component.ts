import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HOME_HERO, HomeHeroContent } from '../../data/home.content';

export type HeroSceneMode = 'night' | 'day';

@Component({
  selector: 'app-lighting-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lighting-hero.component.html',
  styleUrl: './lighting-hero.component.scss',
})
export class LightingHeroComponent implements OnDestroy {
  readonly content: HomeHeroContent = HOME_HERO;
  readonly hintVisible = signal(true);
  readonly finePointer = signal(false);
  readonly sceneMode = signal<HeroSceneMode>('night');

  @ViewChild('stage', { static: true })
  private stageRef!: ElementRef<HTMLElement>;

  private rafId = 0;
  private pendingX = 58;
  private pendingY = 48;
  private currentX = 58;
  private currentY = 48;
  private hasInteracted = false;
  private animating = false;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      this.finePointer.set(mq.matches);
      mq.addEventListener('change', this.onPointerCapabilityChange);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      window
        .matchMedia('(hover: hover) and (pointer: fine)')
        .removeEventListener('change', this.onPointerCapabilityChange);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  setSceneMode(mode: HeroSceneMode): void {
    if (this.sceneMode() === mode) {
      return;
    }
    this.sceneMode.set(mode);
    this.hintVisible.set(mode === 'night' && this.finePointer());
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.sceneMode() !== 'night') {
      return;
    }
    if (!this.finePointer() || event.pointerType === 'touch') {
      return;
    }

    const stage = this.stageRef.nativeElement;
    const rect = stage.getBoundingClientRect();
    this.pendingX = ((event.clientX - rect.left) / rect.width) * 100;
    this.pendingY = ((event.clientY - rect.top) / rect.height) * 100;
    this.startTracking();
    this.markInteracted();
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    if (this.sceneMode() !== 'night' || !this.finePointer()) {
      return;
    }
    this.pendingX = 58;
    this.pendingY = 48;
    this.startTracking();
  }

  private startTracking(): void {
    if (this.animating) {
      return;
    }
    this.animating = true;
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    const ease = 0.18;
    this.currentX += (this.pendingX - this.currentX) * ease;
    this.currentY += (this.pendingY - this.currentY) * ease;

    const stage = this.stageRef.nativeElement;
    stage.style.setProperty('--light-x', `${this.currentX}%`);
    stage.style.setProperty('--light-y', `${this.currentY}%`);

    const dx = Math.abs(this.pendingX - this.currentX);
    const dy = Math.abs(this.pendingY - this.currentY);

    if (dx > 0.04 || dy > 0.04) {
      this.rafId = requestAnimationFrame(() => this.tick());
      return;
    }

    this.animating = false;
    this.rafId = 0;
  }

  private markInteracted(): void {
    if (this.hasInteracted) {
      return;
    }
    this.hasInteracted = true;
    this.hintVisible.set(false);
  }

  private onPointerCapabilityChange = (event: MediaQueryListEvent): void => {
    this.finePointer.set(event.matches);
  };
}
