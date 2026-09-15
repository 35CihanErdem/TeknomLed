import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HOME_FEATURED_PROJECT,
  HomeFeaturedProject,
} from '../../data/home.content';

@Component({
  selector: 'app-featured-project',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './featured-project.component.html',
  styleUrl: './featured-project.component.scss',
})
export class FeaturedProjectComponent {
  readonly project: HomeFeaturedProject = HOME_FEATURED_PROJECT;
}
