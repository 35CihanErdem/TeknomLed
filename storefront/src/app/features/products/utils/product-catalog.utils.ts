import {
  ActiveFilterChip,
  PowerRangeId,
  PriceRangeId,
  Product,
  ProductFilterState,
  ProductSortOption,
} from '../models/product.model';

export function getStartingPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.price));
}

export function getPrimaryImage(product: Product): string {
  return (
    product.images.find((i) => i.type === 'DEFAULT')?.url ??
    product.images[0]?.url ??
    ''
  );
}

export function getSecondaryImage(product: Product): string | null {
  const secondary =
    product.images.find((i) => i.type === 'APPLICATION' || i.type === 'GALLERY') ??
    product.images.find((i) => i.type !== 'DEFAULT');
  return secondary && secondary.url !== getPrimaryImage(product)
    ? secondary.url
    : null;
}

export function getTechnicalSummary(product: Product): string {
  const watts = [
    ...new Set(product.variants.map((v) => v.watt).filter(Boolean) as number[]),
  ].sort((a, b) => a - b);
  const kelvins = [
    ...new Set(
      product.variants.map((v) => v.kelvin).filter(Boolean) as number[]
    ),
  ].sort((a, b) => a - b);

  const wattLabel =
    watts.length === 0
      ? null
      : watts.length === 1
        ? `${watts[0]}W`
        : `${watts[0]}–${watts[watts.length - 1]}W`;

  const kelvinLabel =
    kelvins.length === 0
      ? null
      : kelvins.map((k) => `${k}K`).join(' / ');

  return [wattLabel, product.specifications.ip, kelvinLabel]
    .filter(Boolean)
    .join(' · ');
}

export function formatPriceFrom(price: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted}'dan başlayan`;
}

function wattInRange(watt: number, range: PowerRangeId): boolean {
  switch (range) {
    case '0-10':
      return watt >= 0 && watt <= 10;
    case '11-20':
      return watt >= 11 && watt <= 20;
    case '21-40':
      return watt >= 21 && watt <= 40;
    case '40+':
      return watt > 40;
  }
}

function priceInRange(price: number, range: PriceRangeId): boolean {
  switch (range) {
    case '0-1000':
      return price >= 0 && price <= 1000;
    case '1000-2500':
      return price > 1000 && price <= 2500;
    case '2500-5000':
      return price > 2500 && price <= 5000;
    case '5000+':
      return price > 5000;
  }
}

export function createEmptyFilters(): ProductFilterState {
  return {
    categorySlug: null,
    applicationAreas: [],
    kelvins: [],
    powerRanges: [],
    ipClasses: [],
    priceRanges: [],
  };
}

export function filterProducts(
  products: Product[],
  filters: ProductFilterState
): Product[] {
  return products.filter((product) => {
    if (
      filters.categorySlug &&
      product.category.slug !== filters.categorySlug
    ) {
      return false;
    }

    if (
      filters.applicationAreas.length > 0 &&
      !filters.applicationAreas.some((area) =>
        product.applicationAreas.includes(area)
      )
    ) {
      return false;
    }

    if (filters.kelvins.length > 0) {
      const hasKelvin = product.variants.some(
        (v) => v.kelvin != null && filters.kelvins.includes(v.kelvin)
      );
      if (!hasKelvin) {
        return false;
      }
    }

    if (filters.powerRanges.length > 0) {
      const hasPower = product.variants.some(
        (v) =>
          v.watt != null &&
          filters.powerRanges.some((range) => wattInRange(v.watt!, range))
      );
      if (!hasPower) {
        return false;
      }
    }

    if (filters.ipClasses.length > 0) {
      const ip = product.specifications.ip;
      if (!ip || !filters.ipClasses.includes(ip)) {
        return false;
      }
    }

    if (filters.priceRanges.length > 0) {
      const start = getStartingPrice(product);
      if (!filters.priceRanges.some((range) => priceInRange(start, range))) {
        return false;
      }
    }

    return true;
  });
}

export function sortProducts(
  products: Product[],
  sort: ProductSortOption
): Product[] {
  const list = [...products];

  switch (sort) {
    case 'price-asc':
      return list.sort(
        (a, b) => getStartingPrice(a) - getStartingPrice(b)
      );
    case 'price-desc':
      return list.sort(
        (a, b) => getStartingPrice(b) - getStartingPrice(a)
      );
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    case 'recommended':
    default:
      return list.sort((a, b) => {
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'tr');
      });
  }
}

export function buildActiveFilterChips(
  filters: ProductFilterState,
  categories: { slug: string; name: string }[]
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.categorySlug) {
    const category = categories.find((c) => c.slug === filters.categorySlug);
    if (category) {
      chips.push({
        id: `category:${category.slug}`,
        group: 'category',
        label: category.name,
        value: category.slug,
      });
    }
  }

  for (const area of filters.applicationAreas) {
    chips.push({
      id: `applicationAreas:${area}`,
      group: 'applicationAreas',
      label: area,
      value: area,
    });
  }

  for (const kelvin of filters.kelvins) {
    chips.push({
      id: `kelvins:${kelvin}`,
      group: 'kelvins',
      label: `${kelvin}K`,
      value: kelvin,
    });
  }

  const powerLabels: Record<PowerRangeId, string> = {
    '0-10': '0–10W',
    '11-20': '11–20W',
    '21-40': '21–40W',
    '40+': '40W+',
  };
  for (const range of filters.powerRanges) {
    chips.push({
      id: `powerRanges:${range}`,
      group: 'powerRanges',
      label: powerLabels[range],
      value: range,
    });
  }

  for (const ip of filters.ipClasses) {
    chips.push({
      id: `ipClasses:${ip}`,
      group: 'ipClasses',
      label: ip,
      value: ip,
    });
  }

  const priceLabels: Record<PriceRangeId, string> = {
    '0-1000': '0–1.000 TL',
    '1000-2500': '1.000–2.500 TL',
    '2500-5000': '2.500–5.000 TL',
    '5000+': '5.000 TL+',
  };
  for (const range of filters.priceRanges) {
    chips.push({
      id: `priceRanges:${range}`,
      group: 'priceRanges',
      label: priceLabels[range],
      value: range,
    });
  }

  return chips;
}

export function toggleListValue<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}
