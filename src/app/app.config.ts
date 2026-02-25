import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AUTH_SERVICE, DATA_SERVICE } from './core/tokens/service-tokens';
import { MockAuthService } from './core/mock/mock-auth.service';
import { MockDataService } from './core/mock/mock-data.service';

import { LucideAngularModule, AlertTriangle, Award, Banknote, BarChart2, Bell, CheckCircle, ChevronRight, Circle, ClipboardList, Clock, Coffee, CreditCard, Flame, Folder, Hash, LayoutGrid, Lock, LogOut, Mail, Package, Pencil, RefreshCw, Sparkles, Trash2, TrendingUp, Users, Utensils, Wallet, Wrench } from "lucide-angular";

const ICONS = { AlertTriangle, Award, Banknote, BarChart2, Bell, CheckCircle, ChevronRight, Circle, ClipboardList, Clock, Coffee, CreditCard, Flame, Folder, Hash, LayoutGrid, Lock, LogOut, Mail, Package, Pencil, RefreshCw, Sparkles, Trash2, TrendingUp, Users, Utensils, Wallet, Wrench };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick(ICONS)),

    { provide: AUTH_SERVICE, useClass: MockAuthService },
    { provide: DATA_SERVICE, useClass: MockDataService },

    // ── Para conectar Firebase real, reemplaza las 2 líneas de arriba por: ──
    // { provide: AUTH_SERVICE, useClass: FirebaseAuthService },
    // { provide: DATA_SERVICE, useClass: FirestoreDataService },
    // ── Y agrega los providers de Firebase: ────────────────────────────────
    // import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
    // import { environment } from '../environments/environment';
    // import { provideFirestore, getFirestore } from '@angular/fire/firestore';
    // import { provideAuth, getAuth } from '@angular/fire/auth';
    // import { provideFunctions, getFunctions } from '@angular/fire/functions';
    //
    // provideFirebaseApp(() => initializeApp(environment.firebase)),
    // provideFirestore(() => getFirestore()),
    // provideAuth(() => getAuth()),
    // provideFunctions(() => getFunctions())
  ]
};
