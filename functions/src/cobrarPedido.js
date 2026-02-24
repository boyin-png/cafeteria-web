const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verificarRol } = require('./helpers/verificarRol');

/**
 * cobrarPedido — LA FUNCIÓN MÁS CRÍTICA
 *
 * Recalcula totales desde cero en el servidor. NUNCA confía en los montos del cliente.
 *
 * Recibe: { pedidoId, metodoPago, datosCliente }
 * Retorna: { ventaId, totalPagado }
 */
exports.cobrarPedido = onCall(async (request) => {
    const db = getFirestore();
    const { pedidoId, metodoPago, datosCliente } = request.data;

    // ── 1. Verificar rol ──
    const cajero = await verificarRol(request.auth, ['cajero', 'admin'], db);

    // ── Validar inputs ──
    if (!pedidoId || typeof pedidoId !== 'string') {
        throw new HttpsError('invalid-argument', 'El ID del pedido es requerido.');
    }
    if (!['efectivo', 'tarjeta'].includes(metodoPago)) {
        throw new HttpsError('invalid-argument', 'Método de pago inválido. Usa "efectivo" o "tarjeta".');
    }

    // ── 2. Buscar turno abierto del cajero ──
    const turnosSnap = await db.collection('turnos_caja')
        .where('cajero_id', '==', request.auth.uid)
        .where('estado', '==', 'abierto')
        .limit(1)
        .get();

    if (turnosSnap.empty) {
        throw new HttpsError(
            'failed-precondition',
            'No tienes un turno de caja abierto. Abre un turno antes de cobrar.'
        );
    }

    const turnoDoc = turnosSnap.docs[0];

    // ── 3. Obtener pedido ──
    const pedidoRef = db.collection('pedidos').doc(pedidoId);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
        throw new HttpsError('not-found', 'El pedido no existe.');
    }

    const pedido = pedidoSnap.data();

    if (pedido.estado !== 'entregado') {
        throw new HttpsError(
            'failed-precondition',
            `El pedido no se puede cobrar porque su estado es "${pedido.estado}". Solo se cobran pedidos entregados.`
        );
    }

    // ── 4. Obtener configuración de IVA ──
    let ivaPorcentaje = 0;
    try {
        const configSnap = await db.collection('configuracion_negocio').doc('general').get();
        if (configSnap.exists) {
            ivaPorcentaje = configSnap.data().iva_porcentaje || 0;
        }
    } catch {
        // Si no hay config, IVA = 0
    }

    // ── 5. RECALCULAR total desde cero ──
    const items = pedido.items || [];
    let subtotalBruto = 0;

    for (const item of items) {
        const precioBase = Number(item.precio_snapshot) || 0;
        const precioModificadores = (item.modificadores || []).reduce(
            (sum, mod) => sum + (Number(mod.precio_adicional_snapshot) || 0),
            0
        );
        const cantidad = Number(item.cantidad) || 0;
        subtotalBruto += (precioBase + precioModificadores) * cantidad;
    }

    const montoDescuento = Number(pedido.descuento_aplicado?.monto_descontado) || 0;
    const subtotal = subtotalBruto - montoDescuento;
    const impuestos = Math.round(subtotal * ivaPorcentaje / 100 * 100) / 100;
    const totalPagado = Math.round((subtotal + impuestos) * 100) / 100;

    // ── 6. Crear doc en ventas_historial (inmutable) ──
    const ventaData = {
        pedido_id: pedidoId,
        mesa_id: pedido.mesa_id || null,
        turno_id: turnoDoc.id,
        cajero_id: request.auth.uid,
        cajero_nombre: cajero.nombre || '',
        metodo_pago: metodoPago,
        items_vendidos: items,
        subtotal: subtotalBruto,
        descuento_aplicado: pedido.descuento_aplicado || null,
        impuestos,
        total_pagado: totalPagado,
        datos_cliente: datosCliente || null,
        fecha_pago: new Date().toISOString()
    };

    const ventaRef = await db.collection('ventas_historial').add(ventaData);

    // ── 7. Incrementar usos del descuento ──
    if (pedido.descuento_aplicado?.descuento_id) {
        try {
            await db.collection('descuentos')
                .doc(pedido.descuento_aplicado.descuento_id)
                .update({ usos_actuales: FieldValue.increment(1) });
        } catch {
            // No bloquear el cobro si falla el incremento
        }
    }

    // ── 8. Actualizar mesa ──
    if (pedido.mesa_id) {
        try {
            await db.collection('mesas').doc(pedido.mesa_id).update({
                pedido_activo_id: null,
                estado: 'sucia'
            });
        } catch {
            // La mesa se puede limpiar manualmente después
        }
    }

    // ── 9. Actualizar pedido ──
    await pedidoRef.update({ estado: 'pagado' });

    // ── 10. Retornar resultado ──
    return { ventaId: ventaRef.id, totalPagado };
});
