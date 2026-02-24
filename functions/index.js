const { initializeApp } = require('firebase-admin/app');
initializeApp();

exports.cobrarPedido = require('./src/cobrarPedido').cobrarPedido;
exports.abrirTurnoCaja = require('./src/abrirTurnoCaja').abrirTurnoCaja;
exports.cerrarTurnoCaja = require('./src/cerrarTurnoCaja').cerrarTurnoCaja;
exports.crearUsuarioStaff = require('./src/crearUsuarioStaff').crearUsuarioStaff;
exports.descuentarStock = require('./src/descuentarStock').descuentarStock;
