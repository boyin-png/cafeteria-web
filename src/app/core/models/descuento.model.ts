export type TipoDescuento = 'porcentaje' | 'monto_fijo';

export interface CondicionesDescuento {
    dias_semana: number[];
    hora_inicio: string;
    hora_fin: string;
    categoria_id: string | null;
    producto_id: string | null;
    monto_minimo_pedido: number;
    roles_aplicables: string[];
}

export interface Descuento {
    id: string;
    nombre: string;
    tipo: TipoDescuento;
    valor: number;
    condiciones: CondicionesDescuento;
    codigo_cupon: string | null;
    usos_maximos: number | null;
    usos_actuales: number;
    activo: boolean;
    fecha_inicio: string;
    fecha_fin: string;
}
