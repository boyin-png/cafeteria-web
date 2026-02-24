import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
    Firestore,
    collection,
    doc,
    query,
    onSnapshot,
    QueryConstraint,
    where,
    orderBy
} from '@angular/fire/firestore';

export { where, orderBy };

@Injectable({ providedIn: 'root' })
export class RealtimeService {
    private firestore = inject(Firestore);

    /**
     * Escucha cambios en tiempo real de una colección.
     * Compatible con async pipe — cleanup automático al desuscribirse.
     * @param constraints where(), orderBy(), etc.
     */
    listenCollection<T>(coleccion: string, ...constraints: QueryConstraint[]): Observable<T[]> {
        return new Observable<T[]>(observer => {
            const colRef = collection(this.firestore, coleccion);
            const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);

            const unsub = onSnapshot(
                q,
                snap => {
                    const datos = snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
                    observer.next(datos);
                },
                error => {
                    observer.error(error);
                }
            );

            // Cleanup: se ejecuta cuando el async pipe (o cualquier suscriptor) se desuscribe
            return () => unsub();
        });
    }

    /**
     * Escucha cambios en tiempo real de un documento individual.
     * Retorna null si el documento no existe.
     * Compatible con async pipe.
     */
    listenDoc<T>(coleccion: string, id: string): Observable<T | null> {
        return new Observable<T | null>(observer => {
            const docRef = doc(this.firestore, coleccion, id);

            const unsub = onSnapshot(
                docRef,
                snap => {
                    if (!snap.exists()) {
                        observer.next(null);
                        return;
                    }
                    observer.next({ id: snap.id, ...snap.data() } as T);
                },
                error => {
                    observer.error(error);
                }
            );

            return () => unsub();
        });
    }
}
