import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminCatalogService } from '../../../core/admin/admin-catalog.service';
import {
  AdminApplicationAreaDto,
  AdminCategoryDto,
  AdminMediaInput,
  AdminProductDetailDto,
  AdminProductWriteRequest,
} from '../../../core/admin/admin-catalog.models';
import { HasUnsavedChanges } from '../../../core/admin/unsaved-changes.guard';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission } from '../../../core/auth/permissions';

@Component({
  selector: 'app-admin-product-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-editor-page.component.html',
  styleUrl: './admin-product-editor-page.component.scss',
})
export class AdminProductEditorPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(AdminCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly categories = signal<AdminCategoryDto[]>([]);
  readonly areas = signal<AdminApplicationAreaDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly existingMedia = signal<AdminMediaInput[]>([]);

  productId: string | null = null;
  isNew = true;

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.maxLength(200)]],
    shortDescription: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
    categoryId: ['', Validators.required],
    applicationAreaIds: this.fb.control<string[]>([]),
    isFeatured: [false],
    isActive: [false],
    variants: this.fb.array([]),
    specifications: this.fb.array([]),
  });

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  get specifications(): FormArray {
    return this.form.get('specifications') as FormArray;
  }

  get canSave(): boolean {
    return this.isNew
      ? this.auth.can(Permission.ProductCreate)
      : this.auth.can(Permission.ProductUpdate);
  }

  get title(): string {
    return this.isNew ? 'Yeni ürün' : 'Ürün düzenle';
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isNew = !this.productId;

    this.catalog.getCategories().subscribe({
      next: (cats) => this.categories.set(cats.filter((c) => c.isActive || !this.isNew)),
      error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
    });
    this.catalog.getApplicationAreas().subscribe({
      next: (list) => this.areas.set(list.filter((a) => a.isActive || !this.isNew)),
      error: (err) => this.error.set(this.catalog.extractErrorMessage(err)),
    });

    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isNew) {
        return;
      }
      const slugCtrl = this.form.get('slug');
      if (!slugCtrl || slugCtrl.dirty) {
        return;
      }
      slugCtrl.setValue(this.slugify(name ?? ''), { emitEvent: false });
    });

    if (this.isNew) {
      this.addVariant();
      this.loading.set(false);
      return;
    }

    this.catalog.getProduct(this.productId!).subscribe({
      next: (product) => {
        this.patchProduct(product);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.catalog.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  addVariant(values?: {
    id?: string | null;
    sku?: string;
    watt?: number | null;
    lumen?: number | null;
    kelvin?: number | null;
    color?: string | null;
    dimensions?: string | null;
    price?: number;
    stock?: number;
    isActive?: boolean;
  }): void {
    this.variants.push(
      this.fb.group({
        id: [values?.id ?? null],
        sku: [values?.sku ?? '', Validators.required],
        watt: [values?.watt ?? null],
        lumen: [values?.lumen ?? null],
        kelvin: [values?.kelvin ?? null],
        color: [values?.color ?? ''],
        dimensions: [values?.dimensions ?? ''],
        price: [values?.price ?? 0, [Validators.required, Validators.min(0)]],
        stock: [values?.stock ?? 0, [Validators.required, Validators.min(0)]],
        isActive: [values?.isActive ?? true],
      })
    );
    this.form.markAsDirty();
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
    this.form.markAsDirty();
  }

  addSpecification(values?: {
    id?: string | null;
    name?: string;
    value?: string;
    unit?: string | null;
    sortOrder?: number;
  }): void {
    this.specifications.push(
      this.fb.group({
        id: [values?.id ?? null],
        name: [values?.name ?? '', Validators.required],
        value: [values?.value ?? '', Validators.required],
        unit: [values?.unit ?? ''],
        sortOrder: [values?.sortOrder ?? this.specifications.length],
      })
    );
    this.form.markAsDirty();
  }

  removeSpecification(index: number): void {
    this.specifications.removeAt(index);
    this.form.markAsDirty();
  }

  toggleArea(areaId: string, checked: boolean): void {
    const ctrl = this.form.get('applicationAreaIds');
    const current = [...(ctrl?.value ?? [])] as string[];
    const next = checked
      ? Array.from(new Set([...current, areaId]))
      : current.filter((id) => id !== areaId);
    ctrl?.setValue(next);
    ctrl?.markAsDirty();
    this.form.markAsDirty();
  }

  isAreaSelected(areaId: string): boolean {
    const ids = (this.form.get('applicationAreaIds')?.value ?? []) as string[];
    return ids.includes(areaId);
  }

  save(): void {
    if (!this.canSave) {
      this.error.set('Bu işlem için yetkiniz yok.');
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid || this.variants.length === 0) {
      this.error.set('Formu kontrol edin. En az bir varyant gerekli.');
      return;
    }

    const raw = this.form.getRawValue();
    const body: AdminProductWriteRequest = {
      name: String(raw.name).trim(),
      slug: String(raw.slug).trim().toLowerCase(),
      shortDescription: String(raw.shortDescription).trim(),
      description: raw.description ? String(raw.description).trim() : null,
      categoryId: raw.categoryId,
      isFeatured: !!raw.isFeatured,
      isActive: !!raw.isActive,
      applicationAreaIds: raw.applicationAreaIds ?? [],
      variants: this.variants.controls.map((ctrl) => {
        const v = ctrl.getRawValue();
        return {
          id: v.id || null,
          sku: String(v.sku).trim(),
          watt: v.watt === '' || v.watt == null ? null : Number(v.watt),
          lumen: v.lumen === '' || v.lumen == null ? null : Number(v.lumen),
          kelvin: v.kelvin === '' || v.kelvin == null ? null : Number(v.kelvin),
          color: v.color ? String(v.color).trim() : null,
          dimensions: v.dimensions ? String(v.dimensions).trim() : null,
          price: Number(v.price),
          stock: Number(v.stock),
          isActive: !!v.isActive,
        };
      }),
      specifications: this.specifications.controls.map((ctrl, index) => {
        const s = ctrl.getRawValue();
        return {
          id: s.id || null,
          name: String(s.name).trim(),
          value: String(s.value).trim(),
          unit: s.unit ? String(s.unit).trim() : null,
          sortOrder: Number(s.sortOrder ?? index),
        };
      }),
      media: this.existingMedia(),
    };

    this.saving.set(true);
    this.error.set('');
    const request$ = this.isNew
      ? this.catalog.createProduct(body)
      : this.catalog.updateProduct(this.productId!, body);

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.isNew) {
          this.form.markAsPristine();
          void this.router.navigate(['/admin/catalog/products', saved.id]);
          return;
        }
        this.productId = saved.id;
        this.patchProduct(saved);
      },
      error: (err) => {
        this.error.set(this.catalog.extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  private patchProduct(product: AdminProductDetailDto): void {
    this.form.patchValue({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description ?? '',
      categoryId: product.categoryId,
      applicationAreaIds: [...product.applicationAreaIds],
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    });

    this.variants.clear();
    for (const v of product.variants) {
      this.addVariant({
        id: v.id,
        sku: v.sku,
        watt: v.watt,
        lumen: v.lumen,
        kelvin: v.kelvin,
        color: v.color,
        dimensions: v.dimensions,
        price: v.price,
        stock: v.stock,
        isActive: v.isActive,
      });
    }

    this.specifications.clear();
    for (const s of product.specifications) {
      this.addSpecification({
        id: s.id,
        name: s.name,
        value: s.value,
        unit: s.unit,
        sortOrder: s.sortOrder,
      });
    }

    this.existingMedia.set(
      product.media.map((m) => ({
        id: m.id,
        type: m.type,
        path: m.url,
        altText: m.altText,
        sortOrder: m.sortOrder,
        isActive: true,
      }))
    );

    this.form.markAsPristine();
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
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);
  }
}
