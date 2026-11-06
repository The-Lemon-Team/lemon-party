import { Routes } from '@angular/router';

export const partyGameRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./party-game-home.component').then((m) => m.PartyGameHomeComponent),
    title: 'Главное Меню | Lemon Party',
  },
  {
    path: 'field',
    loadComponent: () =>
      import('../components/neuron-arena/arena-field.component').then(
        (m) => m.ArenaFieldComponent,
      ),
    title: 'Игровое Поле & Схватки | Lemon Party',
  },
  {
    path: 'cloud',
    loadComponent: () =>
      import('../components/neuron-arena/party-cloud.component').then(
        (m) => m.PartyCloudComponent,
      ),
    title: 'Хроно-Облако | Lemon Party',
  },
  {
    path: 'cards',
    loadComponent: () =>
      import('../components/neuron-arena/party-cards.component').then(
        (m) => m.PartyCardsComponent,
      ),
    title: 'Карточки Желаний | Lemon Party',
  },
  {
    path: 'heroes',
    loadComponent: () =>
      import('../components/neuron-arena/arena-heroes.component').then(
        (m) => m.ArenaHeroesComponent,
      ),
    title: 'Персонажи | Lemon Party',
  },
  {
    path: 'chronicle',
    loadComponent: () =>
      import('../components/neuron-arena/party-chronicle.component').then(
        (m) => m.PartyChronicleComponent,
      ),
    title: 'Хроника Войсов & AI Датасет | Lemon Party',
  },
  {
    path: 'roulette',
    loadComponent: () =>
      import('./party-roulette-page.component').then(
        (m) => m.PartyRoulettePageComponent,
      ),
    title: 'Колесо Фортуны & Рулетка | Lemon Party',
  },
  {
    path: 'arena',
    redirectTo: 'field',
    pathMatch: 'full',
  },
];
