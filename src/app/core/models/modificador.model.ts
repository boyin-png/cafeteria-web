export interface OpcionModificador {
    id: string;
    nombre: string;
    precio_adicional: number;
}

export interface ModificadorProducto {
    id: string;
    producto_id: string;
    nombre: string;
    obligatorio: boolean;
    seleccion_multiple: boolean;
    opciones: OpcionModificador[];
    activo: boolean;
}
