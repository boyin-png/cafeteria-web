export type RolStaff = 'admin' | 'cocina' | 'mesero' | 'cajero';

export interface UsuarioStaff {
    id: string;
    nombre: string;
    email: string;
    rol: RolStaff;
    pin_acceso: string | null;
    activo: boolean;
    fecha_ingreso: string;
}
