import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService, where } from '../../../core/services/firestore.service';
import { ReportesService } from '../reportes/reportes.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private fs = inject(FirestoreService);
    private reportesService = inject(ReportesService);
    private router = inject(Router);

    usuario = this.authService.currentUser;
    loading = signal(true);
    ahora = new Date();

    // Métricas
    ventasHoy = signal(0);
    mesasActivas = signal(0);
    pedidosPrep = signal(0);
    alertasInventario = signal(0);

    ngOnInit() {
        this.cargarMetricas();
    }

    async cargarMetricas() {
        this.loading.set(true);
        this.ahora = new Date();

        const hoyInicio = new Date(this.ahora);
        hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date(this.ahora);
        hoyFin.setHours(23, 59, 59, 999);

        try {
            const [ventas, mesas, pedidos, inventario] = await Promise.all([
                this.reportesService.getVentasPorRango(hoyInicio, hoyFin),
                this.fs.getAll('mesas', where('estado', '==', 'ocupada')),
                this.fs.getAll('pedidos', where('estado', '==', 'en_preparacion')),
                this.fs.getAll('inventario', where('alerta_activa', '==', true))
            ]);

            this.ventasHoy.set(ventas.reduce((total, v) => total + v.total_pagado, 0));
            this.mesasActivas.set(mesas.length);
            this.pedidosPrep.set(pedidos.length);
            this.alertasInventario.set(inventario.length);
        } catch (error) {
            console.error('Error al cargar métricas:', error);
        } finally {
            this.loading.set(false);
        }
    }

    navegar(ruta: string) {
        this.router.navigate([ruta]);
    }

    formatMoneda(valor: number): string {
        return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
}
