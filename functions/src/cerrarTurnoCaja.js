const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { verificarRol } = require('./helpers/verificarRol');

/**
 * cerrarTurnoCaja
 *
 * Recibe: { turnoId: string }
 * Retorna: void (el resumen se guarda en el turno)
 */
exports.cerrarTurnoCaja = onCall(async (request) => {
    const db = getFirestore();
    const { turnoId } = request.data;

    // ── 1. Verificar rol ──
    const usuario = await verificarRol(request.auth, ['cajero', 'admin'], db);

    // ── Validar input ──
    if (!turnoId || typeof turnoId !== 'string') {
        throw new HttpsError('invalid-argument', 'El ID del turno es requerido.');
    }

    // ── 2. Obtener turno ──
    const turnoRef = db.collection('turnos_caja').doc(turnoId);
    const turnoSnap = await turnoRef.get();

    if (!turnoSnap.exists) {
        throw new HttpsError('not-found', 'El turno no existe.');
    }

    const turno = turnoSnap.data();

    if (turno.estado !== 'abierto') {
        throw new HttpsError('failed-precondition', 'Este turno ya fue cerrado.');
    }

    // Solo el dueño del turno o un admin pueden cerrarlo
    if (turno.cajero_id !== request.auth.uid && usuario.rol !== 'admin') {
        throw new HttpsError('permission-denied', 'Solo puedes cerrar tu propio turno.');
    }

    // ── 3. Sumar todas las ventas del turno ──
    const ventasSnap = await db.collection('ventas_historial')
        .where('turno_id', '==', turnoId)
        .get();

    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalVentas = 0;
    let numTransacciones = 0;

    ventasSnap.forEach((doc) => {
        const venta = doc.data();
        const monto = Number(venta.total_pagado) || 0;
        totalVentas += monto;
        numTransacciones++;

        if (venta.metodo_pago === 'efectivo') {
            totalEfectivo += monto;
        } else if (venta.metodo_pago === 'tarjeta') {
            totalTarjeta += monto;
        }
    });

    // ── 4. Redondear ──
    totalEfectivo = Math.round(totalEfectivo * 100) / 100;
    totalTarjeta = Math.round(totalTarjeta * 100) / 100;
    totalVentas = Math.round(totalVentas * 100) / 100;

    // ── 5. Actualizar turno ──
    await turnoRef.update({
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        resumen_ventas: {
            total_efectivo: totalEfectivo,
            total_tarjeta: totalTarjeta,
            total_ventas: totalVentas,
            num_transacciones: numTransacciones
        }
    });

    return null;
});
