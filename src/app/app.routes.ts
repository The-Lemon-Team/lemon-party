import { Routes } from '@angular/router';
import { PartyGameShellComponent } from './party-game/party-game-shell.component';
import { partyGameRoutes } from './party-game/party-game.routes';

export const routes: Routes = [
  {
    path: 'party',
    component: PartyGameShellComponent,
    children: partyGameRoutes,
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
