import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_SERVICE } from '../tokens/service-tokens';
import { RolStaff } from '../models/usuario-staff.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AUTH_SERVICE);
    const router = inject(Router);
    const roles: string[] = route.data['roles'] ?? [];

    if (roles.length === 0) return true; // sin restriccion
    if (auth.hasRole(...roles as RolStaff[])) return true;

    // Redirigir segun rol
    const rolActual = auth.rol;
    if (rolActual === 'cocina') return router.createUrlTree(['/kds']);
    if (rolActual === 'mesero') return router.createUrlTree(['/admin/mesas']);
    return router.createUrlTree(['/admin/dashboard']);
};
