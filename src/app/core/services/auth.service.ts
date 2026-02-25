import { Injectable, inject, Signal } from '@angular/core';
import { UsuarioStaff, RolStaff } from '../models/usuario-staff.model';
import { AUTH_SERVICE } from '../tokens/service-tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private authToken = inject(AUTH_SERVICE);

    get currentUser(): Signal<UsuarioStaff | null> {
        return this.authToken.currentUser;
    }

    get rol(): RolStaff | null {
        return this.authToken.rol;
    }

    login(email: string, password: string): Promise<void> {
        return this.authToken.login(email, password);
    }

    logout(): Promise<void> {
        return this.authToken.logout();
    }

    hasRole(...roles: RolStaff[]): boolean {
        return this.authToken.hasRole(...roles);
    }
}
