import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolStaff } from '../../core/models/usuario-staff.model';
import { LucideAngularModule } from 'lucide-angular';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    roles: RolStaff[];
}

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
    auth = inject(AuthService);
    private router = inject(Router);

    sidebarOpen = false;
    sidebarExpanded = false;

    navItems: NavItem[] = [
        { label: 'Dashboard', icon: 'layout-dashboard', route: '/admin/dashboard', roles: ['admin', 'cajero'] },
        { label: 'Mesas', icon: 'layout-grid', route: '/admin/mesas', roles: ['admin', 'cajero'] },
        { label: 'Caja', icon: 'credit-card', route: '/admin/caja', roles: ['admin', 'cajero'] },
        { label: 'Menú', icon: 'utensils-crossed', route: '/admin/menu', roles: ['admin'] },
        { label: 'Inventario', icon: 'package', route: '/admin/inventario', roles: ['admin'] },
        { label: 'Staff', icon: 'users', route: '/admin/staff', roles: ['admin'] },
        { label: 'Descuentos', icon: 'tag', route: '/admin/descuentos', roles: ['admin'] },
        { label: 'Reportes', icon: 'bar-chart-2', route: '/admin/reportes', roles: ['admin'] }
    ];

    itemsVisibles = computed(() => {
        const rol = this.auth.currentUser()?.rol;
        if (!rol) return [];
        return this.navItems.filter(item => item.roles.includes(rol));
    });

    nombreUsuario = computed(() => this.auth.currentUser()?.nombre ?? '');
    rolUsuario = computed(() => this.auth.currentUser()?.rol ?? '');

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    async logout(): Promise<void> {
        await this.auth.logout();
        this.router.navigate(['/login']);
    }
}
