import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DATA_SERVICE } from '../tokens/service-tokens';
import { QueryFiltro } from '../abstractions/data.abstract';

export function where(campo: string, operador: any, valor: any): QueryFiltro {
    return { campo, operador, valor };
}

export function orderBy(campo: string, direccion?: any): any {
    return { campo, direccion, tipo: 'orderBy' };
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
    private dataService = inject(DATA_SERVICE);

    /**
     * Escucha cambios en tiempo real de una colección.
     * Compatible con async pipe — cleanup automático al desuscribirse.
     * @param constraints where(), orderBy(), etc.
     */
    listenCollection<T>(coleccion: string, ...constraints: any[]): Observable<T[]> {
        const filtros = constraints.filter(c => !c.tipo) as QueryFiltro[];
        return this.dataService.listen<T>(coleccion, filtros);
    }

    /**
     * Escucha cambios en tiempo real de un documento individual.
     * Retorna null si el documento no existe.
     * Compatible con async pipe.
     */
    listenDoc<T>(coleccion: string, id: string): Observable<T | null> {
        return this.dataService.listen<T>(coleccion, [{ campo: 'id', operador: '==', valor: id }]).pipe(
            map(items => items.length > 0 ? items[0] : null)
        );
    }
}
