import { inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UsuarioStaff, RolStaff } from '../models/usuario-staff.model';
import { AuthAbstract } from '../abstractions/auth.abstract';

export class FirebaseAuthService implements AuthAbstract {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    currentUser = signal<UsuarioStaff | null>(null);

    constructor() {
        // Restaurar sesion al recargar la pagina
        onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (firebaseUser) {
                const perfil = await this.cargarPerfil(firebaseUser.uid);
                this.currentUser.set(perfil);
            } else {
                this.currentUser.set(null);
            }
        });
    }

    private async cargarPerfil(uid: string): Promise<UsuarioStaff | null> {
        // El ID del documento en usuarios_staff ES el UID de Firebase Auth
        const ref = doc(this.firestore, "usuarios_staff", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as UsuarioStaff;
    }

    async login(email: string, password: string): Promise<void> {
        try {
            console.log('[FirebaseAuthService] Llamando a signInWithEmailAndPassword...');
            const cred = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('[FirebaseAuthService] signIn completado. UID:', cred.user.uid);

            console.log('[FirebaseAuthService] Llamando a cargarPerfil...');
            const perfil = await this.cargarPerfil(cred.user.uid);
            console.log('[FirebaseAuthService] Perfil cargado:', perfil);

            if (!perfil) {
                await signOut(this.auth);
                throw new Error("No se encontro el perfil del usuario en el sistema.");
            }
            if (!perfil.activo) {
                await signOut(this.auth);
                throw new Error("Usuario inactivo o sin acceso al sistema.");
            }
            this.currentUser.set(perfil);
            console.log('[FirebaseAuthService] Login exitoso y perfil asignado.');
        } catch (err: any) {
            console.error('[FirebaseAuthService] Error en login:', err);
            // Traducir errores de Firebase Auth a mensajes en español
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
                || err.code === "auth/invalid-credential") {
                throw new Error("Credenciales incorrectas. Verifica tu correo y contrasena.");
            }
            if (err.code === "auth/too-many-requests") {
                throw new Error("Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.");
            }
            if (err.code === "auth/network-request-failed") {
                throw new Error("Sin conexion a internet. Verifica tu red e intenta de nuevo.");
            }
            throw err; // re-lanzar errores propios (usuario inactivo, etc.)
        }
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        this.currentUser.set(null);
    }

    get rol(): RolStaff | null {
        return this.currentUser()?.rol ?? null;
    }

    hasRole(...roles: RolStaff[]): boolean {
        return roles.includes(this.rol as RolStaff);
    }
}
