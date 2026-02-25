## Pasos para conectar Firebase Firestore real

### 1. Instalar dependencias Firebase
   `npm install @angular/fire firebase`

### 2. Rellenar credenciales en environment.ts
   Obtenerlas en Firebase Console > Configuración del proyecto > SDK

### 3. Crear FirebaseAuthService
   Implementar `AuthAbstract` usando Firebase Auth (`signInWithEmailAndPassword`)
   Leer el perfil de `usuarios_staff` con el UID resultante

### 4. Crear FirestoreDataService
   Implementar `DataAbstract` usando `@angular/fire/firestore`
   `listen()` usa `onSnapshot()` en lugar del Map interno del mock

### 5. Cambiar providers en app.config.ts
   Descomentar los providers de Firebase.
   Comentar o eliminar los providers de Mock.

### 6. Crear usuarios en Firebase Console
   Authentication > Users > Add user
   Después crear su documento en `usuarios_staff` con el UID generado

### 7. Verificar Security Rules
   Aplicar el archivo `firestore.rules` del proyecto.
