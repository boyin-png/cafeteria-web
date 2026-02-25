import { Signal } from '@angular/core';
import { UsuarioStaff, RolStaff } from '../models/usuario-staff.model';

export abstract class AuthAbstract {
    abstract currentUser: Signal<UsuarioStaff | null>;
    abstract login(email: string, password: string): Promise<void>;
    abstract logout(): Promise<void>;
    abstract get rol(): RolStaff | null;
    abstract hasRole(...roles: RolStaff[]): boolean;
}
