import { Injectable, signal } from '@angular/core';
import { AuthAbstract } from '../abstractions/auth.abstract';
import { UsuarioStaff, RolStaff } from '../models/usuario-staff.model';
import { MOCK_DB } from './mock-data';

@Injectable({ providedIn: 'root' })
export class MockAuthService implements AuthAbstract {
    currentUser = signal<UsuarioStaff | null>(null);

    constructor() {
        const savedUid = sessionStorage.getItem('mock_uid');
        if (savedUid) {
            const user = MOCK_DB.usuarios_staff.find(u => u.id === savedUid);
            if (user && user.activo) {
                const { password, ...perfilLimpio } = user;
                this.currentUser.set(perfilLimpio as UsuarioStaff);
            }
        }
    }

    get rol(): RolStaff | null {
        return this.currentUser()?.rol ?? null;
    }

    hasRole(...roles: RolStaff[]): boolean {
        const rolActual = this.rol;
        if (!rolActual) return false;
        return roles.includes(rolActual);
    }

    async login(email: string, pass: string): Promise<void> {
        await new Promise(r => setTimeout(r, 400));
        const user = MOCK_DB.usuarios_staff.find(u => u.email === email && u.password === pass);

        if (!user) {
            throw new Error('Credenciales incorrectas.');
        }

        if (!user.activo) {
            throw new Error('Usuario inactivo.');
        }

        const { password, ...perfilLimpio } = user;
        sessionStorage.setItem('mock_uid', user.id);
        this.currentUser.set(perfilLimpio as UsuarioStaff);
    }

    async logout(): Promise<void> {
        await new Promise(r => setTimeout(r, 200));
        sessionStorage.removeItem('mock_uid');
        this.currentUser.set(null);
    }
}
