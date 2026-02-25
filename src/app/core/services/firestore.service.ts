import { Injectable, inject } from '@angular/core';
import { DATA_SERVICE } from '../tokens/service-tokens';
import { QueryFiltro } from '../abstractions/data.abstract';

export function where(campo: string, operador: any, valor: any): QueryFiltro {
    return { campo, operador, valor };
}

export function orderBy(campo: string, direccion?: any): any {
    return { campo, direccion, tipo: 'orderBy' };
}

export function limit(lim: number): any {
    return { limite: lim, tipo: 'limit' };
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
    private dataService = inject(DATA_SERVICE);

    /**
     * Agrega un documento nuevo con ID autogenerado.
     * @returns El ID del documento creado.
     */
    async add<T extends Record<string, any>>(coleccion: string, data: T): Promise<string> {
        return this.dataService.add(coleccion, data);
    }

    /**
     * Crea o sobreescribe un documento con un ID específico.
     */
    async set<T extends Record<string, any>>(coleccion: string, id: string, data: T): Promise<void> {
        await this.dataService.update(coleccion, id, data);
    }

    /**
     * Actualiza campos específicos de un documento existente.
     */
    async update(coleccion: string, id: string, data: Record<string, any>): Promise<void> {
        await this.dataService.update(coleccion, id, data);
    }

    /**
     * Elimina un documento por su ID.
     */
    async delete(coleccion: string, id: string): Promise<void> {
        await this.dataService.delete(coleccion, id);
    }

    /**
     * Obtiene un documento por su ID.
     * @returns El documento con campo 'id' incluido, o null si no existe.
     */
    async getById<T>(coleccion: string, id: string): Promise<T | null> {
        return this.dataService.getById<T>(coleccion, id);
    }

    /**
     * Obtiene todos los documentos de una colección, opcionalmente filtrados.
     * @param constraints where(), orderBy(), limit(), etc.
     */
    async getAll<T>(coleccion: string, ...constraints: any[]): Promise<T[]> {
        const filtros = constraints.filter(c => !c.tipo) as QueryFiltro[];
        return this.dataService.getAll<T>(coleccion, filtros);
    }
}
