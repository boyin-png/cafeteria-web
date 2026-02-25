import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_SERVICE } from '../tokens/service-tokens';
import { RolStaff } from '../models/usuario-staff.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AUTH_SERVICE);
    const router = inject(Router);

    const roles = route.data['roles'] as RolStaff[] | undefined;

    if (!roles || roles.length === 0) {
        return true;
    }

    if (authService.hasRole(...roles)) {
        return true;
    }

    return router.createUrlTree(['/no-autorizado']);
};
