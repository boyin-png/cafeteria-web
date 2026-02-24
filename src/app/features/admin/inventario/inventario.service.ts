import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { Inventario, Insumo } from '../../../core/models/inventario.model';
import { Producto } from '../../../core/models/producto.model';

export interface InventarioConProducto extends Inventario {
    nombre_producto: string;
    disponible: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
    private fs = inject(FirestoreService);
    private authService = inject(AuthService);

    /**
     * Carga todos los documentos de inventario y enriquece cada uno
     * con el nombre y disponibilidad del producto correspondiente.
     */
    async getInventario(): Promise<InventarioConProducto[]> {
        const inventarios = await this.fs.getAll<Inventario>('inventario');

        const enriquecidos = await Promise.all(
            inventarios.map(async (inv) => {
                const producto = await this.fs.getById<Producto>('productos', inv.producto_id);
                return {
                    ...inv,
                    nombre_producto: producto?.nombre ?? 'Producto no encontrado',
                    disponible: producto?.disponible ?? false
                } as InventarioConProducto;
            })
        );

        return enriquecidos;
    }

    /**
     * Actualiza el array de insumos de un documento de inventario.
     * También registra última actualización y quién la hizo.
     */
    async actualizarStock(inventarioId: string, insumosActualizados: Insumo[]): Promise<void> {
        const usuario = this.authService.currentUser();
        await this.fs.update('inventario', inventarioId, {
            insumos: insumosActualizados,
            ultima_actualizacion: new Date().toISOString(),
            actualizado_por_id: usuario?.id ?? ''
        });
    }

    /**
     * Reactiva un producto marcándolo como disponible y desactiva su alerta.
     * Solo debe llamarse si todos los insumos tienen stock_actual >= stock_minimo.
     */
    async reactivarProducto(productoId: string, inventarioId: string): Promise<void> {
        await Promise.all([
            this.fs.update('productos', productoId, { disponible: true }),
            this.fs.update('inventario', inventarioId, { alerta_activa: false })
        ]);
    }
}
