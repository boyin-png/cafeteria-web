export const MOCK_DB = {
    usuarios_staff: [
        {
            id: 'uid-admin-001',
            nombre: 'Carlos Mendoza',
            email: 'admin@smartorder.test',
            password: 'Admin2024!',
            rol: 'admin',
            pin_acceso: '0000',
            activo: true,
            fecha_ingreso: '2024-01-10T09:00:00Z'
        },
        {
            id: 'uid-cajero-002',
            nombre: 'Elena Rodriguez',
            email: 'cajero@smartorder.test',
            password: 'Cajero2024!',
            rol: 'cajero',
            pin_acceso: '1234',
            activo: true,
            fecha_ingreso: '2024-02-15T09:00:00Z'
        },
        {
            id: 'uid-cocina-003',
            nombre: 'Miguel Torres',
            email: 'cocina@smartorder.test',
            password: 'Cocina2024!',
            rol: 'cocina',
            pin_acceso: '5678',
            activo: true,
            fecha_ingreso: '2024-03-01T09:00:00Z'
        },
        {
            id: 'uid-mesero-004',
            nombre: 'Sofia Vargas',
            email: 'mesero@smartorder.test',
            password: 'Mesero2024!',
            rol: 'mesero',
            pin_acceso: '9012',
            activo: true,
            fecha_ingreso: '2024-03-15T09:00:00Z'
        }
    ],
    categorias: [],
    productos: [],
    modificadores_productos: [],
    mesas: [],
    pedidos: [],
    descuentos: [],
    inventario: [],
    turnos_caja: [],
    ventas_historial: [],
    configuracion_negocio: null
};
