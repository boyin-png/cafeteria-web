import { Observable } from 'rxjs';

export interface QueryFiltro {
    campo: string;
    operador: '==' | '!=' | 'in' | '>=' | '<=' | '>' | '<';
    valor: any;
}

export abstract class DataAbstract {
    // Lectura única (Promise)
    abstract getById<T>(coleccion: string, id: string): Promise<T | null>;
    abstract getAll<T>(coleccion: string, filtros?: QueryFiltro[]): Promise<T[]>;
    // Escritura
    abstract add<T>(coleccion: string, data: Omit<T, 'id'>): Promise<string>;
    abstract update(coleccion: string, id: string, data: Partial<any>): Promise<void>;
    abstract delete(coleccion: string, id: string): Promise<void>;
    // Tiempo real (Observable — para mesas, pedidos, KDS)
    abstract listen<T>(coleccion: string, filtros?: QueryFiltro[]): Observable<T[]>;
}
