import { Route } from '@angular/router'

import { UsersPage } from './users-page'

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: UsersPage,
  },
  {
    path: '**',
    redirectTo: '',
  },
]
