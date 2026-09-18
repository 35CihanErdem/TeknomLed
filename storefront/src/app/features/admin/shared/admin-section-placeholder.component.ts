import { Component, Input } from '@angular/core';

/** Shared empty/foundation page for admin sections without live APIs yet. */
@Component({
  selector: 'app-admin-section-placeholder',
  standalone: true,
  template: `
    <section class="ph">
      <h2 class="ph__title">{{ title }}</h2>
      <p class="ph__text">{{ description }}</p>
      @if (phaseNote) {
        <p class="ph__note">{{ phaseNote }}</p>
      }
    </section>
  `,
  styles: [
    `
      .ph {
        max-width: 40rem;
        padding: 1.25rem 1.35rem;
        background: #fff;
        border: 1px solid var(--color-line);
      }
      .ph__title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 650;
      }
      .ph__text {
        margin: 0.65rem 0 0;
        color: var(--color-ink-muted);
        line-height: 1.55;
        font-size: 0.925rem;
      }
      .ph__note {
        margin: 1rem 0 0;
        font-size: 0.8rem;
        letter-spacing: 0.04em;
        color: var(--color-ink-subtle);
      }
    `,
  ],
})
export class AdminSectionPlaceholderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() phaseNote = '';
}
