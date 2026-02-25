import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RealtimeService } from '../../../core/services/realtime.service';
import { FirestoreService, orderBy } from '../../../core/services/firestore.service';
import { Mesa, EstadoMesa } from '../../../core/models/mesa.model';
import { Pedido } from '../../../core/models/pedido.model';

@Component({
    selector: 'app-mesas',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './mesas.component.html',
    styleUrls: ['./mesas.component.css']
})
export class MesasComponent implements OnInit {
    private realtimeService = inject(RealtimeService);
    private firestoreService = inject(FirestoreService);

    mesas$!: Observable<Mesa[]>;
    mesaSeleccionada: Mesa | null = null;
    pedidoActivo: Pedido | null = null;
    cargandoPedido = false;

    /* Contadores */
    contadores = { ocupadas: 0, libres: 0, sucias: 0 };

    ngOnInit(): void {
        this.mesas$ = this.realtimeService.listenCollection<Mesa>('mesas', orderBy('numero'));
    }

    actualizarContadores(mesas: Mesa[]): Mesa[] {
        this.contadores = { ocupadas: 0, libres: 0, sucias: 0 };
        for (const m of mesas) {
            if (m.estado === 'ocupada') this.contadores.ocupadas++;
            else if (m.estado === 'libre') this.contadores.libres++;
            else if (m.estado === 'sucia') this.contadores.sucias++;
        }
        return mesas;
    }

    async seleccionarMesa(mesa: Mesa): Promise<void> {
        this.mesaSeleccionada = mesa;
        this.pedidoActivo = null;

        if (mesa.estado === 'ocupada' && mesa.pedido_activo_id) {
            this.cargandoPedido = true;
            try {
                this.pedidoActivo = await this.firestoreService.getById<Pedido>('pedidos', mesa.pedido_activo_id);
            } catch (error) {
                console.error('[MesasComponent] Error cargando pedido activo:', error);
                this.pedidoActivo = null;
            } finally {
                this.cargandoPedido = false;
            }
        }
    }

    async cambiarEstado(mesaId: string, nuevoEstado: EstadoMesa): Promise<void> {
        await this.firestoreService.update('mesas', mesaId, { estado: nuevoEstado });
        if (this.mesaSeleccionada?.id === mesaId) {
            this.mesaSeleccionada = { ...this.mesaSeleccionada, estado: nuevoEstado };
            if (nuevoEstado === 'libre') {
                this.pedidoActivo = null;
            }
        }
    }

    cerrarPanel(): void {
        this.mesaSeleccionada = null;
        this.pedidoActivo = null;
    }

    tiempoDesde(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '<1 min';
        if (mins < 60) return `${mins} min`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m`;
    }

    claseMesa(estado: EstadoMesa): string {
        return `mesa-${estado}`;
    }

    labelEstado(estado: EstadoMesa): string {
        const labels: Record<EstadoMesa, string> = { libre: 'Libre', ocupada: 'Ocupada', sucia: 'Sucia' };
        return labels[estado];
    }

    trackById(_i: number, mesa: Mesa): string {
        return mesa.id;
    }
}
