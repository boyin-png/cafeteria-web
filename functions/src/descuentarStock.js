const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getFirestore } = require('firebase-admin/firestore');

/**
 * descuentarStock
 *
 * Trigger: se dispara cuando un documento de 'pedidos' es actualizado.
 * Solo actúa cuando el estado cambia de 'pendiente' → 'en_preparacion'.
 * Descuenta insumos del inventario de forma atómica y marca alertas si el stock baja del mínimo.
 */
exports.descuentarStock = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
    try {
        const db = getFirestore();
        const antes = event.data.before.data();
        const despues = event.data.after.data();

        // ── GUARD: solo actuar en la transición pendiente → en_preparacion ──
        if (antes.estado !== 'pendiente' || despues.estado !== 'en_preparacion') {
            return null;
        }

        const items = despues.items || [];
        if (items.length === 0) return null;

        const batch = db.batch();
        let productosActualizados = 0;

        // ── Procesar cada ítem del pedido ──
        for (const item of items) {
            if (!item.producto_id) continue;

            // Buscar inventario del producto
            const invSnap = await db.collection('inventario')
                .where('producto_id', '==', item.producto_id)
                .limit(1)
                .get();

            if (invSnap.empty) continue;

            const invDoc = invSnap.docs[0];
            const invData = invDoc.data();
            const cantidad = Number(item.cantidad) || 0;

            if (cantidad <= 0) continue;

            // Calcular nuevos stocks para cada insumo
            let alertaActiva = false;
            const insumosActualizados = (invData.insumos || []).map((insumo) => {
                const nuevoStock = Math.max(0, (Number(insumo.stock_actual) || 0) - cantidad);
                const stockMinimo = Number(insumo.stock_minimo) || 0;

                if (nuevoStock < stockMinimo) {
                    alertaActiva = true;
                }

                return {
                    ...insumo,
                    stock_actual: nuevoStock
                };
            });

            // Agregar update de inventario al batch
            batch.update(invDoc.ref, {
                insumos: insumosActualizados,
                alerta_activa: alertaActiva,
                ultima_actualizacion: new Date().toISOString()
            });

            // Si hay alerta, retirar producto del menú
            if (alertaActiva) {
                const productoRef = db.collection('productos').doc(item.producto_id);
                batch.update(productoRef, { disponible: false });
            }

            productosActualizados++;
        }

        // ── Ejecutar batch atómico ──
        if (productosActualizados > 0) {
            await batch.commit();
        }

        console.log(
            `Stock actualizado para pedido ${event.params.pedidoId}: ${productosActualizados} producto(s) procesado(s).`
        );

        return null;
    } catch (error) {
        console.error(
            `Error al descontar stock para pedido ${event.params.pedidoId}:`,
            error
        );
        // NO lanzar — los triggers no deben fallar permanentemente
        return null;
    }
});
