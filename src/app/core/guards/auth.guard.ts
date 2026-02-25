import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_SERVICE } from '../tokens/service-tokens';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AUTH_SERVICE);
    const router = inject(Router);

    if (authService.currentUser()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};
