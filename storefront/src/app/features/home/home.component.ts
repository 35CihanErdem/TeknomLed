import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContainerComponent } from '../../shared/components/container/container.component';
import { LightComparisonComponent } from '../../shared/components/light-comparison/light-comparison.component';
import { LightingHeroComponent } from './components/lighting-hero/lighting-hero.component';
import { CategoryShowcaseComponent } from './components/category-showcase/category-showcase.component';
import { FeaturedProjectComponent } from './components/featured-project/featured-project.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { ProjectShowcaseComponent } from './components/project-showcase/project-showcase.component';
import {
  HOME_COMPARISON,
  HOME_CONTACT_CTA,
  HOME_INTRO,
  HOME_TRUST,
} from './data/home.content';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    ContainerComponent,
    LightingHeroComponent,
    CategoryShowcaseComponent,
    FeaturedProjectComponent,
    FeaturedProductsComponent,
    ProjectShowcaseComponent,
    LightComparisonComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly intro = HOME_INTRO;
  readonly trust = HOME_TRUST;
  readonly contactCta = HOME_CONTACT_CTA;
  readonly comparison = HOME_COMPARISON;
}
