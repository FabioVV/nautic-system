import { Routes } from '@angular/router';
import { authGuard } from '../shared/guards/auth.guard';

import { AccessoriesTypesPage } from './products/accessories/accessories_types';
import { EnginesPage } from './products/engines/engines';
import { BoatsPage } from './products/boats/boats';
import { AccessoriesPage } from './products/accessories/accessories';

export default [
    { path: 'accessories', component: AccessoriesPage, canActivate: [authGuard], data: { "code": "accessories:view" } },
    { path: 'accessories-types', component: AccessoriesTypesPage, canActivate: [authGuard], data: { "code": "accessories_types:view" } },
    { path: 'boats', component: BoatsPage, canActivate: [authGuard], data: { "code": "pboats:view" } },
    { path: 'engines', component: EnginesPage, canActivate: [authGuard], data: { "code": "engines:view" } },
] as Routes;
