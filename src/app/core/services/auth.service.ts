import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UsuarioStaff, RolStaff } from '../models/usuario-staff.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);

    /** Signal reactivo con el usuario actual autenticado (null si no hay sesión). */
    currentUser = signal<UsuarioStaff | null>(null);

    /** Rol del usuario actual, o null si no hay sesión. */
    rol = computed<RolStaff | null>(() => this.currentUser()?.rol ?? null);

    constructor() {
        onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                try {
                    const perfil = await this.obtenerPerfilStaff(firebaseUser.uid);
                    if (perfil && perfil.activo) {
                        this.currentUser.set(perfil);
                    } else {
                        await signOut(this.auth);
                        this.currentUser.set(null);
                    }
                } catch {
                    await signOut(this.auth);
                    this.currentUser.set(null);
                }
            } else {
                this.currentUser.set(null);
            }
        });
    }

    /**
     * Inicia sesión con email y password.
     * Valida que el usuario exista en usuarios_staff y esté activo.
     * @throws Error descriptivo si la autenticación o validación falla.
     */
    async login(email: string, password: string): Promise<UsuarioStaff> {
        let uid: string;

        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            uid = credential.user.uid;
        } catch {
            throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        }

        const perfil = await this.obtenerPerfilStaff(uid);

        if (!perfil) {
            await signOut(this.auth);
            throw new Error('Tu cuenta no tiene un perfil de staff asignado. Contacta al administrador.');
        }

        if (!perfil.activo) {
            await signOut(this.auth);
            throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
        }

        this.currentUser.set(perfil);
        return perfil;
    }

    /** Cierra sesión y limpia el estado reactivo. */
    async logout(): Promise<void> {
        this.currentUser.set(null);
        await signOut(this.auth);
    }

    /**
     * Verifica si el usuario actual tiene alguno de los roles indicados.
     * @param roles Lista de roles permitidos.
     * @returns true si el rol del usuario coincide con alguno de los proporcionados.
     */
    hasRole(...roles: RolStaff[]): boolean {
        const rolActual = this.rol();
        if (!rolActual) return false;
        return roles.includes(rolActual);
    }

    /**
     * Lee el documento del usuario en la colección 'usuarios_staff'.
     * El ID del documento es el UID de Firebase Auth.
     */
    private async obtenerPerfilStaff(uid: string): Promise<UsuarioStaff | null> {
        const docRef = doc(this.firestore, 'usuarios_staff', uid);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        return { id: snap.id, ...snap.data() } as UsuarioStaff;
    }
}
