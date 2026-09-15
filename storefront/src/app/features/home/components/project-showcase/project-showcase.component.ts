import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContainerComponent } from '../../../../shared/components/container/container.component';
import { HOME_PROJECTS, HomeProject } from '../../data/home.content';

@Component({
  selector: 'app-project-showcase',
  standalone: true,
  imports: [RouterLink, ContainerComponent],
  templateUrl: './project-showcase.component.html',
  styleUrl: './project-showcase.component.scss',
})
export class ProjectShowcaseComponent {
  readonly projects: HomeProject[] = HOME_PROJECTS;
}
