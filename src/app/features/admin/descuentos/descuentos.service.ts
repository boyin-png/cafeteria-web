import { Injectable, inject } from '@angular/core';
import { FirestoreService, orderBy } from '../../../core/services/firestore.service';
import { Descuento } from '../../../core/models/descuento.model';

@Injectable({ providedIn: 'root' })
export class DescuentosService {
    private fs = inject(FirestoreService);

    async getDescuentos(): Promise<Descuento[]> {
        try {
            return await this.fs.getAll<Descuento>('descuentos', orderBy('fecha_inicio', 'desc'));
        } catch {
            throw new Error('Error al cargar los descuentos.');
        }
    }

    async crearDescuento(data: Omit<Descuento, 'id' | 'usos_actuales'>): Promise<string> {
        try {
            return await this.fs.add('descuentos', { ...data, usos_actuales: 0 });
        } catch {
            throw new Error('Error al crear el descuento.');
        }
    }

    async actualizarDescuento(id: string, data: Partial<Descuento>): Promise<void> {
        // NUNCA incluir usos_actuales — solo Cloud Functions lo modifica
        const { usos_actuales, ...safe } = data as any;
        try {
            await this.fs.update('descuentos', id, safe);
        } catch {
            throw new Error('Error al actualizar el descuento.');
        }
    }

    async toggleActivo(id: string, activo: boolean): Promise<void> {
        try {
            await this.fs.update('descuentos', id, { activo });
        } catch {
            throw new Error('Error al cambiar el estado del descuento.');
        }
    }

    async eliminarDescuento(id: string, usosActuales: number): Promise<void> {
        if (usosActuales > 0) {
            throw new Error('No se puede eliminar un descuento que ya ha sido utilizado.');
        }
        try {
            await this.fs.delete('descuentos', id);
        } catch {
            throw new Error('Error al eliminar el descuento.');
        }
    }
}
