import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeService } from '../../core/services/realtime.service';
import { FirestoreService, where } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Pedido } from '../../core/models/pedido.model';

import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-kds',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './kds.component.html',
    styleUrls: ['./kds.component.css']
})
export class KdsComponent implements OnInit, OnDestroy {
    private realtimeService = inject(RealtimeService);
    private firestoreService = inject(FirestoreService);
    private authService = inject(AuthService);

    pedidosActivos$!: Observable<Pedido[]>;
    horaActual = '';
    private intervaloReloj: any;

    ngOnInit(): void {
        this.pedidosActivos$ = this.realtimeService.listenCollection<Pedido>(
            'pedidos',
            where('estado', 'in', ['pendiente', 'en_preparacion'])
        ).pipe(
            map(pedidos => pedidos.sort((a, b) => a.timestamp.localeCompare(b.timestamp)))
        );

        this.actualizarReloj();
        this.intervaloReloj = setInterval(() => this.actualizarReloj(), 1000);
    }

    ngOnDestroy(): void {
        if (this.intervaloReloj) {
            clearInterval(this.intervaloReloj);
        }
    }

    async avanzarEstado(pedido: Pedido): Promise<void> {
        const usuario = this.authService.currentUser();
        if (!usuario) return;

        if (pedido.estado === 'pendiente') {
            await this.firestoreService.update('pedidos', pedido.id, {
                estado: 'en_preparacion',
                cocinado_por_id: usuario.id
            });
        } else if (pedido.estado === 'en_preparacion') {
            await this.firestoreService.update('pedidos', pedido.id, {
                estado: 'listo'
            });
        }
    }

    tiempoEspera(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutos = Math.floor(diff / 60000);
        if (minutos < 1) return '<1 min';
        return `${minutos} min`;
    }

    claseUrgencia(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutos = Math.floor(diff / 60000);
        if (minutos >= 15) return 'urgente';
        if (minutos >= 8) return 'alerta';
        return 'normal';
    }

    trackById(_index: number, pedido: Pedido): string {
        return pedido.id;
    }

    textoBoton(estado: string): string {
        if (estado === 'pendiente') return '▶ Iniciar Preparación';
        if (estado === 'en_preparacion') return '✔ Marcar Listo';
        return '✓ Listo';
    }

    claseBoton(estado: string): string {
        if (estado === 'pendiente') return 'btn-iniciar';
        if (estado === 'en_preparacion') return 'btn-listo';
        return 'btn-completado';
    }

    badgeEstado(estado: string): string {
        if (estado === 'pendiente') return 'Pendiente';
        if (estado === 'en_preparacion') return 'Preparando';
        return estado;
    }

    private actualizarReloj(): void {
        const ahora = new Date();
        this.horaActual = ahora.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
