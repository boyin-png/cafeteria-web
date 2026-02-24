const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { verificarRol } = require('./helpers/verificarRol');

/**
 * abrirTurnoCaja
 *
 * Recibe: { fondoInicial: number }
 * Retorna: { turnoId: string }
 */
exports.abrirTurnoCaja = onCall(async (request) => {
    const db = getFirestore();
    const { fondoInicial } = request.data;

    // ── 1. Verificar rol ──
    await verificarRol(request.auth, ['cajero', 'admin'], db);

    // ── Validar input ──
    const fondo = Number(fondoInicial);
    if (isNaN(fondo) || fondo < 0) {
        throw new HttpsError('invalid-argument', 'El fondo inicial debe ser un número mayor o igual a 0.');
    }

    // ── 2. Verificar que NO exista turno abierto ──
    const turnosAbiertos = await db.collection('turnos_caja')
        .where('cajero_id', '==', request.auth.uid)
        .where('estado', '==', 'abierto')
        .limit(1)
        .get();

    if (!turnosAbiertos.empty) {
        throw new HttpsError(
            'already-exists',
            'Ya tienes un turno de caja abierto. Ciérralo antes de abrir uno nuevo.'
        );
    }

    // ── 3. Crear turno ──
    const turnoData = {
        cajero_id: request.auth.uid,
        estado: 'abierto',
        fondo_inicial: fondo,
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: null,
        resumen_ventas: null
    };

    const turnoRef = await db.collection('turnos_caja').add(turnoData);

    // ── 4. Retornar ──
    return { turnoId: turnoRef.id };
});
