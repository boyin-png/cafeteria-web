export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'pagado';

export interface ModificadorAplicado {
    grupo_id: string;
    opcion_id: string;
    nombre: string;
    precio_adicional_snapshot: number;
}

export interface ItemPedido {
    producto_id: string;
    nombre: string;
    precio_snapshot: number;
    cantidad: number;
    especificaciones: string;
    modificadores_aplicados: ModificadorAplicado[];
}

export interface DescuentoAplicado {
    descuento_id: string;
    nombre: string;
    monto_descontado: number;
}

export interface Pedido {
    id: string;
    mesa_id: string;
    cliente_uid: string;
    atendido_por_id: string;
    cocinado_por_id: string;
    estado: EstadoPedido;
    items: ItemPedido[];
    descuento_aplicado: DescuentoAplicado | null;
    subtotal: number;
    total: number;
    timestamp: string;
}
