export type EstadoMesa = 'libre' | 'ocupada' | 'sucia';

export interface Mesa {
    id: string;
    numero: number;
    estado: EstadoMesa;
    pedido_activo_id: string | null;
}
