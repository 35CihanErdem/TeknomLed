import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminCatalogService } from '../../../core/admin/admin-catalog.service';
import { AdminApplicationAreaDto } from '../../../core/admin/admin-catalog.models';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission } from '../../../core/auth/permissions';

@Component({
  selector: 'app-admin-application-areas-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-application-areas-page.component.html',
  styleUrl: './admin-application-areas-page.component.scss',
})
export class AdminApplicationAreasPageComponent implements OnInit {
  private readonly catalog = inject(AdminCatalogService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<AdminApplicationAreaDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    sortOrder: [0, Validators.required],
    isActive: [true],
  });

  get canCreate(): boolean {
    return this.auth.can(Permission.ProductCreate);
  }

  get canUpdate(): boolean {
    return this.auth.can(Permission.ProductUpdate);
  }

  ngOnInit(): void {
    this.form.get('name')?.valueChanges.subscribe((name) => {
      if (this.editingId()) {
        return;
      }
      const slug = this.form.get('slug');
      if (!slug || slug.dirty) {
        return;
      }
      slug.setValue(this.slugify(name ?? ''), { emitEvent: false });
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.catalog.getApplicationAreas().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.catalog.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      slug: '',
      sortOrder: this.items().length,
      isActive: true,
    });
    this.form.markAsPristine();
  }

  startEdit(item: AdminApplicationAreaDto): void {
    this.editingId.set(item.id);
    this.form.setValue({
      name: item.name,
      slug: item.slug,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    this.form.markAsPristine();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Formu kontrol edin.');
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: String(raw.name).trim(),
      slug: String(raw.slug).trim().toLowerCase(),
      sortOrder: Number(raw.sortOrder),
      isActive: !!raw.isActive,
    };

    const id = this.editingId();
    if (id) {
      if (!this.canUpdate) {
        this.error.set('Bu işlem için yetkiniz yok.');
        return;
      }
      this.catalog.updateApplicationArea(id, body).subscribe({
        next: () => {
          this.startCreate();
          this.load();
        },
        error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
      });
      return;
    }

    if (!this.canCreate) {
      this.error.set('Bu işlem için yetkiniz yok.');
      return;
    }
    this.catalog.createApplicationArea(body).subscribe({
      next: () => {
        this.startCreate();
        this.load();
      },
      error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
