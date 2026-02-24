import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'kds',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'cocina'] },
        loadComponent: () =>
            import('./features/kds/kds.component').then(m => m.KdsComponent)
    },
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'cajero'] },
        loadComponent: () =>
            import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'cajero'] },
                loadComponent: () =>
                    import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'mesas',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'cajero'] },
                loadComponent: () =>
                    import('./features/admin/mesas/mesas.component').then(m => m.MesasComponent)
            },
            {
                path: 'caja',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'cajero'] },
                loadComponent: () =>
                    import('./features/admin/caja/caja.component').then(m => m.CajaComponent)
            },
            {
                path: 'menu',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                loadComponent: () =>
                    import('./features/admin/menu/menu.component').then(m => m.MenuComponent)
            },
            {
                path: 'inventario',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                loadComponent: () =>
                    import('./features/admin/inventario/inventario.component').then(m => m.InventarioComponent)
            },
            {
                path: 'staff',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                loadComponent: () =>
                    import('./features/admin/staff/staff.component').then(m => m.StaffComponent)
            },
            {
                path: 'descuentos',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                loadComponent: () =>
                    import('./features/admin/descuentos/descuentos.component').then(m => m.DescuentosComponent)
            },
            {
                path: 'reportes',
                canActivate: [roleGuard],
                data: { roles: ['admin'] },
                loadComponent: () =>
                    import('./features/admin/reportes/reportes.component').then(m => m.ReportesComponent)
            }
        ]
    },
    {
        path: 'no-autorizado',
        loadComponent: () =>
            import('./features/shared/unauthorized.component').then(m => m.UnauthorizedComponent)
    },
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
