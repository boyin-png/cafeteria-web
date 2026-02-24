import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolStaff } from '../../core/models/usuario-staff.model';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    roles: RolStaff[];
}

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    sidebarOpen = false;

    navItems: NavItem[] = [
        { label: 'Dashboard', icon: '📊', route: '/admin/dashboard', roles: ['admin', 'cajero'] },
        { label: 'Mesas', icon: '🪑', route: '/admin/mesas', roles: ['admin', 'cajero'] },
        { label: 'Caja', icon: '💳', route: '/admin/caja', roles: ['admin', 'cajero'] },
        { label: 'Menú', icon: '🍽️', route: '/admin/menu', roles: ['admin'] },
        { label: 'Inventario', icon: '📦', route: '/admin/inventario', roles: ['admin'] },
        { label: 'Staff', icon: '👥', route: '/admin/staff', roles: ['admin'] },
        { label: 'Descuentos', icon: '🏷️', route: '/admin/descuentos', roles: ['admin'] },
        { label: 'Reportes', icon: '📈', route: '/admin/reportes', roles: ['admin'] }
    ];

    itemsVisibles = computed(() => {
        const rol = this.authService.currentUser()?.rol;
        if (!rol) return [];
        return this.navItems.filter(item => item.roles.includes(rol));
    });

    nombreUsuario = computed(() => this.authService.currentUser()?.nombre ?? '');
    rolUsuario = computed(() => this.authService.currentUser()?.rol ?? '');

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    async logout(): Promise<void> {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
