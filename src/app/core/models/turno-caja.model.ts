export type EstadoTurno = 'abierto' | 'cerrado';

export interface ResumenVentas {
    total_efectivo: number;
    total_tarjeta: number;
    total_ventas: number;
    num_transacciones: number;
}

export interface TurnoCaja {
    id: string;
    cajero_id: string;
    fecha_apertura: string;
    fecha_cierre: string | null;
    fondo_inicial: number;
    estado: EstadoTurno;
    resumen_ventas: ResumenVentas | null;
    diferencia_caja: number | null;
    notas_cierre: string | null;
}
