import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RolStaff } from '../models/usuario-staff.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
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
