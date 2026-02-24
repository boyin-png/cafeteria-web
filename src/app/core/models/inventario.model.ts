export interface Insumo {
    nombre: string;
    unidad: string;
    stock_actual: number;
    stock_minimo: number;
}

export interface Inventario {
    id: string;
    producto_id: string;
    insumos: Insumo[];
    alerta_activa: boolean;
    ultima_actualizacion: string;
    actualizado_por_id: string;
}
