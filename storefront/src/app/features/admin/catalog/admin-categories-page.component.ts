import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminCatalogService } from '../../../core/admin/admin-catalog.service';
import { AdminCategoryDto } from '../../../core/admin/admin-catalog.models';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission } from '../../../core/auth/permissions';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories-page.component.html',
  styleUrl: './admin-categories-page.component.scss',
})
export class AdminCategoriesPageComponent implements OnInit {
  private readonly catalog = inject(AdminCatalogService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<AdminCategoryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
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
    this.catalog.getCategories().subscribe({
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
      description: '',
      sortOrder: this.items().length,
      isActive: true,
    });
    this.form.markAsPristine();
  }

  startEdit(item: AdminCategoryDto): void {
    this.editingId.set(item.id);
    this.form.setValue({
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
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
      description: raw.description ? String(raw.description).trim() : null,
      sortOrder: Number(raw.sortOrder),
      isActive: !!raw.isActive,
    };

    const id = this.editingId();
    if (id) {
      if (!this.canUpdate) {
        this.error.set('Bu işlem için yetkiniz yok.');
        return;
      }
      this.catalog.updateCategory(id, body).subscribe({
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
    this.catalog.createCategory(body).subscribe({
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
