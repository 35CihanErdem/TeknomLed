import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContainerComponent } from '../../../../shared/components/container/container.component';
import { HOME_CATEGORIES, HomeCategory } from '../../data/home.content';

@Component({
  selector: 'app-category-showcase',
  standalone: true,
  imports: [RouterLink, ContainerComponent],
  templateUrl: './category-showcase.component.html',
  styleUrl: './category-showcase.component.scss',
})
export class CategoryShowcaseComponent {
  readonly categories: HomeCategory[] = HOME_CATEGORIES;
}
