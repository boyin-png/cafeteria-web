import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UsuarioStaff, RolStaff } from '../../../core/models/usuario-staff.model';
import { orderBy } from '@angular/fire/firestore';

interface CrearStaffPayload {
    nombre: string;
    email: string;
    password: string;
    rol: RolStaff;
    pin_acceso?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
    private functions = inject(Functions);
    private fs = inject(FirestoreService);

    /**
     * Retorna todos los miembros del staff, ordenados por nombre.
     */
    async getStaff(): Promise<UsuarioStaff[]> {
        try {
            return await this.fs.getAll<UsuarioStaff>('usuarios_staff', orderBy('nombre'));
        } catch {
            throw new Error('Error al cargar el listado de staff.');
        }
    }

    /**
     * Crea un nuevo usuario vía Cloud Function (Auth + Firestore doc en servidor).
     * @returns UID del usuario creado.
     */
    async crearStaff(data: CrearStaffPayload): Promise<string> {
        try {
            const fn = httpsCallable<CrearStaffPayload, { uid: string }>(this.functions, 'crearUsuarioStaff');
            const result = await fn(data);
            return result.data.uid;
        } catch (error: any) {
            if (error?.code === 'functions/already-exists') {
                throw new Error('Ya existe un usuario con ese correo electrónico.');
            }
            if (error?.code === 'functions/invalid-argument') {
                throw new Error(error.message || 'Datos inválidos para crear el usuario.');
            }
            if (error?.code === 'functions/permission-denied') {
                throw new Error('No tienes permisos para crear usuarios.');
            }
            throw new Error(error.message || 'Error al crear el usuario.');
        }
    }

    /**
     * Actualiza campos editables del documento de staff (NO toca Firebase Auth).
     */
    async actualizarStaff(
        id: string,
        data: Partial<{ nombre: string; rol: RolStaff; pin_acceso: string; activo: boolean }>
    ): Promise<void> {
        try {
            await this.fs.update('usuarios_staff', id, data);
        } catch {
            throw new Error('Error al actualizar los datos del empleado.');
        }
    }

    /**
     * Cambia el campo activo del usuario. Con activo=false se bloquea su login.
     */
    async toggleActivo(id: string, activo: boolean): Promise<void> {
        try {
            await this.fs.update('usuarios_staff', id, { activo });
        } catch {
            throw new Error('Error al cambiar el estado del empleado.');
        }
    }
}
