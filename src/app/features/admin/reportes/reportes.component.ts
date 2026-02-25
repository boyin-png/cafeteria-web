import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ReportesService, MetricasReporte, VentaDia } from './reportes.service';
import { VentaHistorial } from '../../../core/models/venta-historial.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type RangoRapido = 'hoy' | 'semana' | 'mes' | 'custom';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './reportes.component.html',
    styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
    private reportesService = inject(ReportesService);

    /* ── Filtros ── */
    rangoSeleccionado: RangoRapido = 'hoy';
    fechaDesde = '';
    fechaHasta = '';

    /* ── Data ── */
    ventas: VentaHistorial[] = [];
    metricas: MetricasReporte | null = null;
    ventasPorDia: VentaDia[] = [];
    cargando = false;
    errorGeneral = '';

    /* ── Paginación ── */
    pagina = 1;
    porPagina = 20;

    /* ── Modal detalle ── */
    modalDetalle = false;
    ventaDetalle: VentaHistorial | null = null;

    /* ── Chart ── */
    @ViewChild('ventasChart') ventasChartRef!: ElementRef<HTMLCanvasElement>;
    private chart: Chart | null = null;

    ngOnInit(): void {
        this.setRango('hoy');
        this.aplicar();
    }

    /* ══════════════════════════════════
       FILTROS
       ══════════════════════════════════ */

    setRango(rango: RangoRapido): void {
        this.rangoSeleccionado = rango;
        const hoy = new Date();
        const fmt = (d: Date) => d.toISOString().substring(0, 10);

        switch (rango) {
            case 'hoy':
                this.fechaDesde = this.fechaHasta = fmt(hoy);
                break;
            case 'semana': {
                const inicio = new Date(hoy);
                inicio.setDate(hoy.getDate() - hoy.getDay());
                this.fechaDesde = fmt(inicio);
                this.fechaHasta = fmt(hoy);
                break;
            }
            case 'mes': {
                const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                this.fechaDesde = fmt(inicio);
                this.fechaHasta = fmt(hoy);
                break;
            }
            case 'custom':
                break;
        }
    }

    async aplicar(): Promise<void> {
        if (!this.fechaDesde || !this.fechaHasta) return;
        this.cargando = true;
        this.errorGeneral = '';
        this.pagina = 1;

        const inicio = new Date(this.fechaDesde + 'T00:00:00');
        const fin = new Date(this.fechaHasta + 'T23:59:59');

        try {
            this.ventas = await this.reportesService.getVentasPorRango(inicio, fin);
            this.metricas = this.reportesService.calcularMetricas(this.ventas);
            this.ventasPorDia = this.reportesService.agruparPorDia(this.ventas);
            setTimeout(() => this.renderChart(), 0);
        } catch (e: any) {
            this.errorGeneral = e.message;
        } finally {
            this.cargando = false;
        }
    }

    /* ══════════════════════════════════
       CHART
       ══════════════════════════════════ */

    private renderChart(): void {
        if (this.chart) this.chart.destroy();
        if (!this.ventasChartRef) return;

        const ctx = this.ventasChartRef.nativeElement.getContext('2d');
        if (!ctx) return;

        const labels = this.ventasPorDia.map(d => {
            const parts = d.fecha.split('-');
            return `${parts[2]}/${parts[1]}`;
        });
        const data = this.ventasPorDia.map(d => d.total);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#2196F3',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (v: any) => `$${v}` }
                    }
                }
            }
        });
    }

    /* ══════════════════════════════════
       PAGINACIÓN
       ══════════════════════════════════ */

    get ventasPaginadas(): VentaHistorial[] {
        const start = (this.pagina - 1) * this.porPagina;
        return this.ventas.slice(start, start + this.porPagina);
    }

    get totalPaginas(): number {
        return Math.ceil(this.ventas.length / this.porPagina) || 1;
    }

    paginaAnterior(): void { if (this.pagina > 1) this.pagina--; }
    paginaSiguiente(): void { if (this.pagina < this.totalPaginas) this.pagina++; }

    /* ══════════════════════════════════
       MODAL DETALLE
       ══════════════════════════════════ */

    verDetalle(v: VentaHistorial): void {
        this.ventaDetalle = v;
        this.modalDetalle = true;
    }

    cerrarDetalle(): void {
        this.modalDetalle = false;
        this.ventaDetalle = null;
    }

    /* ══════════════════════════════════
       HELPERS
       ══════════════════════════════════ */

    formatMoneda(valor: number): string {
        return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatFechaHora(fecha: string): string {
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
}
