/**
 * Home content — LUMERA visual direction.
 * Local prototype imagery under /assets/images/home/
 * Hero/comparison keep lightOffImage + lightOnImage for future aligned pairs.
 */

export interface HomeHeroContent {
  eyebrow: string;
  headingLead: string;
  headingAccent: string;
  supportingText: string;
  ctaLabel: string;
  ctaPath: string;
  interactionHint: string;
  lightOffImage: string;
  lightOnImage: string;
  imageAlt: string;
}

export interface HomeCategory {
  id: string;
  name: string;
  image: string;
  path: string;
}

export interface HomeProduct {
  slug: string;
  name: string;
  specs: string;
  image: string;
}

export interface HomeFeaturedProject {
  eyebrow: string;
  titleLines: [string, string];
  text: string;
  ctaLabel: string;
  ctaPath: string;
  image: string;
  imageAlt: string;
}

export interface HomeProject {
  id: string;
  title: string;
  location: string;
  image: string;
}

export interface HomeComparisonContent {
  eyebrow: string;
  title: string;
  description: string;
  lightOffImage: string;
  lightOnImage: string;
  imageAlt: string;
  beforeLabel: string;
  afterLabel: string;
}

export interface HomeTrustHighlight {
  title: string;
  text: string;
}

const HOME_IMG = '/assets/images/home';

const IMG = {
  heroLightOff: `${HOME_IMG}/hero-light-off.jpg`,
  heroLightOn: `${HOME_IMG}/hero-light-on.jpg`,
  categoryFacade: `${HOME_IMG}/category-facade.jpg`,
  categoryWall: `${HOME_IMG}/category-decorative.jpg`,
  categoryLandscape: `${HOME_IMG}/category-garden.jpg`,
  productLineWall: `${HOME_IMG}/product-linea.jpg`,
  productArcWall: `${HOME_IMG}/product-aura.jpg`,
  productStepLine: `${HOME_IMG}/product-terra.jpg`,
  productWallBeam: `${HOME_IMG}/product-wall.jpg`,
  featuredProject: `${HOME_IMG}/project-facade.jpg`,
  projectVilla: `${HOME_IMG}/project-villa.jpg`,
  projectLandscape: `${HOME_IMG}/project-landscape.jpg`,
  projectFacade: `${HOME_IMG}/category-path.jpg`,
  /**
   * Official slots (customer-supplied matched pair):
   *   light-comparison-off.webp / light-comparison-on.webp
   * Development fallback: identical temporary JPGs (no CSS OFF simulation).
   */
  comparisonLightOff: `${HOME_IMG}/light-comparison-off.jpg`,
  comparisonLightOn: `${HOME_IMG}/light-comparison-on.jpg`,
} as const;

export const HOME_HERO: HomeHeroContent = {
  eyebrow: 'MİMARİ AYDINLATMA',
  headingLead: 'Işık, mekânı',
  headingAccent: 'değiştirir.',
  supportingText:
    'Mimari çizgileri görünür kılan, yaşam alanlarını gece yeniden tasarlayan profesyonel LED aydınlatma çözümleri.',
  ctaLabel: 'KOLEKSİYONU KEŞFET →',
  ctaPath: '/products',
  interactionHint: "● MOUSE'U HAREKET ETTİR — IŞIĞI KEŞFET",
  lightOffImage: IMG.heroLightOff,
  lightOnImage: IMG.heroLightOn,
  imageAlt: 'Gece mimari dış mekân aydınlatma sahnesi',
};

export const HOME_INTRO = {
  headingLines: ['Işığı değil,', 'atmosferi tasarlıyoruz.'],
  text: 'Bahçeden cepheye, yürüyüş yollarından ticari alanlara kadar her mekân için dengeli, modern ve karakter sahibi aydınlatma çözümleri.',
} as const;

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: 'cephe',
    name: 'Cephe Aydınlatma',
    image: IMG.categoryFacade,
    path: '/products',
  },
  {
    id: 'duvar',
    name: 'Duvar Aydınlatma',
    image: IMG.categoryWall,
    path: '/products',
  },
  {
    id: 'peyzaj',
    name: 'Peyzaj Aydınlatma',
    image: IMG.categoryLandscape,
    path: '/products',
  },
];

export const HOME_FEATURED_PROJECT: HomeFeaturedProject = {
  eyebrow: 'ÖNE ÇIKAN PROJE',
  titleLines: ['Geceye yeni', 'bir mimari.'],
  text: 'Doğru ışık yalnızca yolu göstermez. Dokuyu, derinliği ve mimarinin karakterini ortaya çıkarır.',
  ctaLabel: 'PROJEYİ İNCELE →',
  ctaPath: '/projects',
  image: IMG.featuredProject,
  imageAlt: 'Öne çıkan mimari aydınlatma projesi',
};

export const HOME_PRODUCTS: HomeProduct[] = [
  {
    slug: 'line-wall-120',
    name: 'LINE WALL 120',
    specs: '3000K · IP65 · 30W',
    image: IMG.productLineWall,
  },
  {
    slug: 'arc-wall',
    name: 'ARC WALL',
    specs: '3000K · IP65 · 12W',
    image: IMG.productArcWall,
  },
  {
    slug: 'step-line',
    name: 'STEP LINE',
    specs: 'Warm White · IP66',
    image: IMG.productStepLine,
  },
  {
    slug: 'wall-beam',
    name: 'WALL BEAM',
    specs: '3000K · IP65 · 12W',
    image: IMG.productWallBeam,
  },
];

export const HOME_PRODUCTS_INTRO = {
  headingLines: ['Öne çıkan', 'ürünler.'],
  text: 'Minimal tasarım, yüksek verimlilik ve mimari projeler için geliştirilmiş profesyonel ışık karakteri.',
} as const;

export const HOME_PROJECTS: HomeProject[] = [
  {
    id: 'villa-izmir',
    title: 'Modern Villa',
    location: 'İzmir',
    image: IMG.projectVilla,
  },
  {
    id: 'landscape-cesme',
    title: 'Landscape Residence',
    location: 'Çeşme',
    image: IMG.projectLandscape,
  },
  {
    id: 'facade-istanbul',
    title: 'Architectural Facade',
    location: 'İstanbul',
    image: IMG.projectFacade,
  },
];

export const HOME_COMPARISON: HomeComparisonContent = {
  eyebrow: 'Deneyim',
  title: 'Önce ışığı deneyimleyin.',
  description:
    'Aydınlatmanın mekâna kattığı farkı yan yana görün. Üretimde hizalı LIGHT_OFF / LIGHT_ON görselleriyle değiştirilebilir.',
  lightOffImage: IMG.comparisonLightOff,
  lightOnImage: IMG.comparisonLightOn,
  imageAlt: 'Mimari mekân aydınlatma karşılaştırması',
  beforeLabel: 'IŞIK KAPALI',
  afterLabel: 'IŞIK AÇIK',
};

export const HOME_TRUST = {
  statement: 'Projeden ürüne, doğru aydınlatma çözümü.',
  highlights: [
    {
      title: 'Mimari Aydınlatma',
      text: 'Mekânın mimarisine uygun, sade ve kalıcı çözümler.',
    },
    {
      title: 'Proje Desteği',
      text: 'Ürün seçiminden uygulamaya kadar teknik yönlendirme.',
    },
    {
      title: 'Profesyonel Ürünler',
      text: 'Dayanıklı, ölçülebilir performanslı aydınlatma ürünleri.',
    },
  ] satisfies HomeTrustHighlight[],
};

export const HOME_CONTACT_CTA = {
  title: 'Projeniz için doğru ışığı birlikte bulalım.',
  contactLabel: 'İletişime Geç',
  contactPath: '/contact',
  whatsappLabel: 'WhatsApp',
  whatsappHref: 'https://wa.me/',
};
