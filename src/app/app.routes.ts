import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'party',
    loadComponent: () =>
      import('./party-game/party-game-shell.component').then(
        (m) => m.PartyGameShellComponent,
      ),
    loadChildren: () =>
      import('./party-game/party-game.routes').then((m) => m.partyGameRoutes),
  },
  {
    path: 'game',
    redirectTo: 'party',
    pathMatch: 'prefix',
  },
  {
    path: 'arena',
    redirectTo: 'party/field',
    pathMatch: 'full',
  },
  {
    path: 'arena/heroes',
    redirectTo: 'party/heroes',
  },
  {
    path: 'roulette',
    redirectTo: 'party/roulette',
  },
  {
    path: 'cards',
    redirectTo: 'party/cards',
  },
  {
    path: 'cloud',
    redirectTo: 'party/cloud',
  },
  {
    path: 'chronicle',
    redirectTo: 'party/chronicle',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'party',
  },
  {
    path: '**',
    redirectTo: 'party',
  },
];
