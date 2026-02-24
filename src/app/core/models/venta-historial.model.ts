import { DescuentoAplicado, ItemPedido } from './pedido.model';

export type MetodoPago = 'efectivo' | 'tarjeta';

export interface DetallesCliente {
    nombre: string;
    email: string | null;
    datos_fiscales: string | null;
}

export interface VentaHistorial {
    id: string;
    pedido_id: string;
    cajero_id: string;
    turno_id: string;
    fecha_pago: string;
    metodo_pago: MetodoPago;
    subtotal: number;
    impuestos: number;
    total_pagado: number;
    descuento_aplicado: DescuentoAplicado | null;
    detalles_cliente: DetallesCliente;
    items_vendidos: ItemPedido[];
}
