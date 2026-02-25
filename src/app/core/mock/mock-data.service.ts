import { Injectable } from '@angular/core';
import { DataAbstract, QueryFiltro } from '../abstractions/data.abstract';
import { Observable, Subscriber } from 'rxjs';
import { MOCK_DB } from './mock-data';

@Injectable({ providedIn: 'root' })
export class MockDataService implements DataAbstract {
    private listeners = new Map<string, Set<{ subscriber: Subscriber<any[]>, filtros?: QueryFiltro[] }>>();

    private delay(ms: number = 150): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }

    private applyFilters<T>(data: T[], filtros?: QueryFiltro[]): T[] {
        if (!filtros || filtros.length === 0) return data;

        return data.filter(item => {
            for (const f of filtros) {
                const val = (item as any)[f.campo];
                switch (f.operador) {
                    case '==': if (val !== f.valor) return false; break;
                    case '!=': if (val === f.valor) return false; break;
                    case 'in': if (!Array.isArray(f.valor) || !f.valor.includes(val)) return false; break;
                    case '>=': if (val < f.valor) return false; break;
                    case '<=': if (val > f.valor) return false; break;
                    case '>': if (val <= f.valor) return false; break;
                    case '<': if (val >= f.valor) return false; break;
                }
            }
            return true;
        });
    }

    private notifyListeners(coleccion: string) {
        const coleccionListeners = this.listeners.get(coleccion);
        if (!coleccionListeners) return;

        const allData = (MOCK_DB as any)[coleccion] || [];
        coleccionListeners.forEach(listenerObj => {
            const filtered = this.applyFilters(allData, listenerObj.filtros);
            listenerObj.subscriber.next([...filtered]);
        });
    }

    async getById<T>(coleccion: string, id: string): Promise<T | null> {
        await this.delay();
        const data = (MOCK_DB as any)[coleccion] as T[] || [];
        const item = data.find((x: any) => x.id === id);
        return item ? { ...item } : null;
    }

    async getAll<T>(coleccion: string, filtros?: QueryFiltro[]): Promise<T[]> {
        await this.delay();
        const data = (MOCK_DB as any)[coleccion] as T[] || [];
        return this.applyFilters(data, filtros).map(x => ({ ...x }));
    }

    async add<T>(coleccion: string, data: Omit<T, 'id'>): Promise<string> {
        await this.delay();
        const id = 'mock_' + coleccion + '_' + Date.now();
        const newItem = { id, ...data };

        if (!(MOCK_DB as any)[coleccion]) {
            (MOCK_DB as any)[coleccion] = [];
        }
        (MOCK_DB as any)[coleccion].push(newItem);

        this.notifyListeners(coleccion);
        return id;
    }

    async update(coleccion: string, id: string, data: Partial<any>): Promise<void> {
        await this.delay();
        const colData = (MOCK_DB as any)[coleccion] as any[] || [];
        const index = colData.findIndex((x: any) => x.id === id);

        if (index !== -1) {
            colData[index] = { ...colData[index], ...data };
            this.notifyListeners(coleccion);
        }
    }

    async delete(coleccion: string, id: string): Promise<void> {
        await this.delay();
        const colData = (MOCK_DB as any)[coleccion] as any[] || [];
        const index = colData.findIndex((x: any) => x.id === id);
        if (index !== -1) {
            colData.splice(index, 1);
            this.notifyListeners(coleccion);
        }
    }

    listen<T>(coleccion: string, filtros?: QueryFiltro[]): Observable<T[]> {
        return new Observable<T[]>(subscriber => {
            const data = (MOCK_DB as any)[coleccion] as T[] || [];
            const filtered = this.applyFilters(data, filtros);
            subscriber.next([...filtered]);

            const listenerObj = { subscriber, filtros };

            if (!this.listeners.has(coleccion)) {
                this.listeners.set(coleccion, new Set());
            }
            this.listeners.get(coleccion)!.add(listenerObj);

            return () => {
                const coleccionListeners = this.listeners.get(coleccion);
                if (coleccionListeners) {
                    coleccionListeners.delete(listenerObj);
                }
            };
        });
    }
}
