import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    QueryConstraint,
    where,
    orderBy,
    limit
} from '@angular/fire/firestore';

export { where, orderBy, limit };

@Injectable({ providedIn: 'root' })
export class FirestoreService {
    private firestore = inject(Firestore);

    /**
     * Agrega un documento nuevo con ID autogenerado.
     * @returns El ID del documento creado.
     */
    async add<T extends Record<string, any>>(coleccion: string, data: T): Promise<string> {
        const colRef = collection(this.firestore, coleccion);
        const docRef = await addDoc(colRef, data);
        return docRef.id;
    }

    /**
     * Crea o sobreescribe un documento con un ID específico.
     */
    async set<T extends Record<string, any>>(coleccion: string, id: string, data: T): Promise<void> {
        const docRef = doc(this.firestore, coleccion, id);
        await setDoc(docRef, data);
    }

    /**
     * Actualiza campos específicos de un documento existente.
     */
    async update(coleccion: string, id: string, data: Record<string, any>): Promise<void> {
        const docRef = doc(this.firestore, coleccion, id);
        await updateDoc(docRef, data);
    }

    /**
     * Elimina un documento por su ID.
     */
    async delete(coleccion: string, id: string): Promise<void> {
        const docRef = doc(this.firestore, coleccion, id);
        await deleteDoc(docRef);
    }

    /**
     * Obtiene un documento por su ID.
     * @returns El documento con campo 'id' incluido, o null si no existe.
     */
    async getById<T>(coleccion: string, id: string): Promise<T | null> {
        const docRef = doc(this.firestore, coleccion, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as T;
    }

    /**
     * Obtiene todos los documentos de una colección, opcionalmente filtrados.
     * @param constraints where(), orderBy(), limit(), etc.
     */
    async getAll<T>(coleccion: string, ...constraints: QueryConstraint[]): Promise<T[]> {
        const colRef = collection(this.firestore, coleccion);
        const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
    }
}
