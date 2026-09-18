import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-admin-access-denied',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-access-denied.component.html',
  styleUrl: './admin-access-denied.component.scss',
})
export class AdminAccessDeniedComponent {
  private readonly route = inject(ActivatedRoute);

  readonly from = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('from'))),
    { initialValue: null }
  );
}
