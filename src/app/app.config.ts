import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { routes } from './app.routes';
import { AUTH_SERVICE, DATA_SERVICE } from './core/tokens/service-tokens';
import { FirebaseAuthService } from './core/services/firebase-auth.service';
import { FirestoreDataService } from './core/services/firestore-data.service';
import { environment } from '../environments/environment';

import { LucideAngularModule, AlertTriangle, Award, Banknote, BarChart2, Bell, CheckCircle, ChevronRight, Circle, ClipboardList, Clock, Coffee, CreditCard, Download, Eye, EyeOff, Filter, Flame, Folder, Hash, LayoutDashboard, LayoutGrid, Lock, LogOut, Mail, Menu, Package, Pencil, Plus, Printer, RefreshCw, Search, Settings, ShoppingBag, Sparkles, Tag, Trash2, TrendingUp, Users, Utensils, UtensilsCrossed, Wallet, Wrench, X } from "lucide-angular";

const ICONS = { AlertTriangle, Award, Banknote, BarChart2, Bell, CheckCircle, ChevronRight, Circle, ClipboardList, Clock, Coffee, CreditCard, Download, Eye, EyeOff, Filter, Flame, Folder, Hash, LayoutDashboard, LayoutGrid, Lock, LogOut, Mail, Menu, Package, Pencil, Plus, Printer, RefreshCw, Search, Settings, ShoppingBag, Sparkles, Tag, Trash2, TrendingUp, Users, Utensils, UtensilsCrossed, Wallet, Wrench, X };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    { provide: AUTH_SERVICE, useClass: FirebaseAuthService },
    { provide: DATA_SERVICE, useClass: FirestoreDataService },
    importProvidersFrom(LucideAngularModule.pick(ICONS)),
    // NOTA: MockAuthService y MockDataService ya no se usan.
    // Puedes dejar los archivos mock intactos por si necesitas volver.
  ]
};
