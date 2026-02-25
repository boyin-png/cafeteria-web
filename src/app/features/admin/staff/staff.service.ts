import { Injectable, inject } from '@angular/core';
import { FirestoreService, orderBy } from '../../../core/services/firestore.service';
import { UsuarioStaff, RolStaff } from '../../../core/models/usuario-staff.model';

interface CrearStaffPayload {
    nombre: string;
    email: string;
    password: string;
    rol: RolStaff;
    pin_acceso?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
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
     * Crea un nuevo usuario vía Cloud Function (Mocked).
     * @returns UID del usuario creado.
     */
    async crearStaff(data: CrearStaffPayload): Promise<string> {
        try {
            return await this.fs.add('usuarios_staff', data);
        } catch (error: any) {
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
