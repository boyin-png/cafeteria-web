import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService, where } from '../../../core/services/firestore.service';
import { ReportesService } from '../reportes/reportes.service';
import { LucideAngularModule } from 'lucide-angular';

export interface MetricasDashboard {
    ventasHoy: number;
    mesasActivas: number;
    enPreparacion: number;
    alertasInventario: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    auth = inject(AuthService);
    private fs = inject(FirestoreService);
    private reportesService = inject(ReportesService);
    private router = inject(Router);

    isLoading = false;
    ahora = new Date();

    metricas: MetricasDashboard = {
        ventasHoy: 0,
        mesasActivas: 0,
        enPreparacion: 0,
        alertasInventario: 0
    };

    ngOnInit() {
        this.cargarMetricas();
    }

    async cargarMetricas() {
        this.isLoading = true;
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

            this.metricas.ventasHoy = ventas.reduce((total, v) => total + v.total_pagado, 0);
            this.metricas.mesasActivas = mesas.length;
            this.metricas.enPreparacion = pedidos.length;
            this.metricas.alertasInventario = inventario.length;
        } catch (error) {
            console.error('Error al cargar métricas:', error);
        } finally {
            this.isLoading = false;
        }
    }

    recargar() {
        this.cargarMetricas();
    }
}
