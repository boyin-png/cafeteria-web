import { inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, QueryConstraint } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DataAbstract, QueryFiltro } from '../abstractions/data.abstract';

export class FirestoreDataService implements DataAbstract {
    private firestore = inject(Firestore);

    async getById<T>(coleccion: string, id: string): Promise<T | null> {
        const ref = doc(this.firestore, coleccion, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as T;
    }

    async getAll<T>(coleccion: string, filtros: QueryFiltro[] = []): Promise<T[]> {
        const constraints = this.filtrosAConstraints(filtros);
        const ref = collection(this.firestore, coleccion);
        const q = query(ref, ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
    }

    async add<T>(coleccion: string, data: Omit<T, "id">): Promise<string> {
        const ref = collection(this.firestore, coleccion);
        const docRef = await addDoc(ref, data);
        return docRef.id;
    }

    async update(coleccion: string, id: string, data: Partial<any>): Promise<void> {
        const ref = doc(this.firestore, coleccion, id);
        await updateDoc(ref, data);
    }

    async delete(coleccion: string, id: string): Promise<void> {
        const ref = doc(this.firestore, coleccion, id);
        await deleteDoc(ref);
    }

    listen<T>(coleccion: string, filtros: QueryFiltro[] = []): Observable<T[]> {
        return new Observable(observer => {
            const constraints = this.filtrosAConstraints(filtros);
            const ref = collection(this.firestore, coleccion);
            const q = query(ref, ...constraints);
            const unsub = onSnapshot(q,
                snap => {
                    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
                    observer.next(docs);
                },
                err => observer.error(err)
            );
            return () => unsub(); // cleanup al desuscribirse
        });
    }

    private filtrosAConstraints(filtros: QueryFiltro[]): QueryConstraint[] {
        return filtros.map(f => {
            if (f.operador === "in") return where(f.campo, "in", f.valor);
            return where(f.campo, f.operador as any, f.valor);
        });
    }
}
