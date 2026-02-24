export interface Producto {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria_id: string;
    disponible: boolean;
    imagen_url: string;
}
