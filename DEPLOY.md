# 🚀 Guía de Deploy - SmartOrder Sync

Sigue estos pasos para desplegar la aplicación a producción o probarla localmente con emuladores.

## 🛠️ Desarrollo Local (Emuladores)

Para probar la integración con Firebase localmente:

```bash
firebase emulators:start
```
> Esto iniciará la UI de emuladores en `http://localhost:4000` y el hosting en `http://localhost:5000`.

---

## 🏗️ Build y Deploy a Producción

Ejecuta los siguientes comandos en orden para un despliegue completo:

1. **Generar el build de Angular:**
   ```bash
   ng build --configuration production
   ```

2. **Desplegar Hosting (Frontend):**
   ```bash
   firebase deploy --only hosting
   ```

3. **Desplegar Seguridad (Firestore Rules):**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Desplegar Índices (Firestore Indexes):**
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Desplegar Functions (Backend):**
   ```bash
   firebase deploy --only functions
   ```

### ⚡ Deploy Todo Junto
Si ya tienes todo configurado, puedes desplegar todo el proyecto a la vez:
```bash
firebase deploy
```

---

## ✅ Verificación Post-Deploy (Checklist)

Después de realizar el deploy, verifica manualmente los siguientes puntos:

1. [ ] **Login:** ¿Puedes iniciar sesión con un usuario de staff existente?
2. [ ] **Auth Guard:** Si intentas entrar a `/admin` sin sesion, ¿te redirige a `/login`?
3. [ ] **Rol Admin:** ¿El admin puede ver el Dashboard con métricas?
4. [ ] **KDS:** ¿El personal de cocina puede ver los pedidos en tiempo real en `/kds`?
5. [ ] **Mesas:** ¿Se listan correctamente todas las mesas y su estado?
6. [ ] **Apertura de Cuenta:** ¿Al ocupar una mesa se crea correctamente el pedido en Firestore?
7. [ ] **Adición de Productos:** ¿Los productos se añaden al pedido con el precio correcto?
8. [ ] **Cierre y Cobro:** ¿Al cobrar se genera el documento en `ventas_historial`?
9. [ ] **Inventario:** ¿Al realizar una venta se descuenta el stock (si las functions están activas)?
10. [ ] **Dashboard:** ¿Las métricas de "Ventas del Día" se actualizan después de cobrar una mesa?

---
*Mantenimiento: SmartOrder Sync Team*
