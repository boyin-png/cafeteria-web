import { InjectionToken } from '@angular/core';
import { AuthAbstract } from '../abstractions/auth.abstract';
import { DataAbstract } from '../abstractions/data.abstract';

export const AUTH_SERVICE = new InjectionToken<AuthAbstract>('AUTH_SERVICE');
export const DATA_SERVICE = new InjectionToken<DataAbstract>('DATA_SERVICE');
