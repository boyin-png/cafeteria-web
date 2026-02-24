const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 *
 * @param {object|null} auth  — context.auth del callable
 * @param {string[]} rolesPermitidos — ej: ['cajero','admin']
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<object>} El documento del usuario (para uso posterior)
 */
async function verificarRol(auth, rolesPermitidos, db) {
    if (!auth || !auth.uid) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const userSnap = await db.collection('usuarios_staff').doc(auth.uid).get();

    if (!userSnap.exists) {
        throw new HttpsError('permission-denied', 'Usuario no registrado en el sistema.');
    }

    const userData = userSnap.data();

    if (!userData.activo) {
        throw new HttpsError('permission-denied', 'Tu cuenta está desactivada. Contacta al administrador.');
    }

    if (!rolesPermitidos.includes(userData.rol)) {
        throw new HttpsError(
            'permission-denied',
            `No tienes permisos para esta operación. Roles requeridos: ${rolesPermitidos.join(', ')}.`
        );
    }

    return { uid: auth.uid, ...userData };
}

module.exports = { verificarRol };
