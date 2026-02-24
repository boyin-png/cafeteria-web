import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from './staff.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioStaff, RolStaff } from '../../../core/models/usuario-staff.model';

@Component({
    selector: 'app-staff',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './staff.component.html',
    styleUrls: ['./staff.component.css']
})
export class StaffComponent implements OnInit {
    private staffService = inject(StaffService);
    private authService = inject(AuthService);

    staff: UsuarioStaff[] = [];
    cargando = true;
    isLoading = false;
    errorGeneral = '';
    roles: RolStaff[] = ['admin', 'cajero', 'cocina', 'mesero'];

    /* ── Modal crear ── */
    modalCrear = false;
    formCrear = { nombre: '', email: '', password: '', rol: 'mesero' as RolStaff, pin_acceso: '' };
    showPassword = false;
    erroresCrear: string[] = [];

    /* ── Modal editar ── */
    modalEditar = false;
    staffEditando: UsuarioStaff | null = null;
    formEditar = { nombre: '', rol: 'mesero' as RolStaff, pin_acceso: '' };
    erroresEditar: string[] = [];

    async ngOnInit(): Promise<void> {
        await this.cargarStaff();
    }

    async cargarStaff(): Promise<void> {
        this.cargando = true;
        try {
            this.staff = await this.staffService.getStaff();
        } catch (e: any) {
            this.errorGeneral = e.message;
        } finally {
            this.cargando = false;
        }
    }

    /* ══════════════════════════════════
       CREAR STAFF
       ══════════════════════════════════ */

    abrirModalCrear(): void {
        this.formCrear = { nombre: '', email: '', password: '', rol: 'mesero', pin_acceso: '' };
        this.erroresCrear = [];
        this.showPassword = false;
        this.modalCrear = true;
    }

    private validarCrear(): string[] {
        const e: string[] = [];
        if (!this.formCrear.nombre.trim()) e.push('El nombre es requerido.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formCrear.email)) e.push('Email inválido.');
        if (this.formCrear.password.length < 6) e.push('La contraseña debe tener al menos 6 caracteres.');
        if (this.formCrear.pin_acceso && !/^\d{4}$/.test(this.formCrear.pin_acceso)) e.push('El PIN debe ser exactamente 4 dígitos.');
        return e;
    }

    async confirmarCrear(): Promise<void> {
        this.erroresCrear = this.validarCrear();
        if (this.erroresCrear.length) return;

        this.isLoading = true;
        try {
            await this.staffService.crearStaff({
                nombre: this.formCrear.nombre.trim(),
                email: this.formCrear.email.trim().toLowerCase(),
                password: this.formCrear.password,
                rol: this.formCrear.rol,
                ...(this.formCrear.pin_acceso ? { pin_acceso: this.formCrear.pin_acceso } : {})
            });
            this.modalCrear = false;
            await this.cargarStaff();
        } catch (e: any) {
            this.erroresCrear = [e.message];
        } finally {
            this.isLoading = false;
        }
    }

    cerrarModalCrear(): void { this.modalCrear = false; }

    /* ══════════════════════════════════
       EDITAR STAFF
       ══════════════════════════════════ */

    abrirModalEditar(user: UsuarioStaff): void {
        this.staffEditando = user;
        this.formEditar = { nombre: user.nombre, rol: user.rol, pin_acceso: user.pin_acceso || '' };
        this.erroresEditar = [];
        this.modalEditar = true;
    }

    private validarEditar(): string[] {
        const e: string[] = [];
        if (!this.formEditar.nombre.trim()) e.push('El nombre es requerido.');
        if (this.formEditar.pin_acceso && !/^\d{4}$/.test(this.formEditar.pin_acceso)) e.push('El PIN debe ser exactamente 4 dígitos.');
        return e;
    }

    async confirmarEditar(): Promise<void> {
        if (!this.staffEditando) return;
        this.erroresEditar = this.validarEditar();
        if (this.erroresEditar.length) return;

        this.isLoading = true;
        try {
            await this.staffService.actualizarStaff(this.staffEditando.id, {
                nombre: this.formEditar.nombre.trim(),
                rol: this.formEditar.rol,
                ...(this.formEditar.pin_acceso ? { pin_acceso: this.formEditar.pin_acceso } : {})
            });
            this.modalEditar = false;
            await this.cargarStaff();
        } catch (e: any) {
            this.erroresEditar = [e.message];
        } finally {
            this.isLoading = false;
        }
    }

    cerrarModalEditar(): void { this.modalEditar = false; this.staffEditando = null; }

    /* ══════════════════════════════════
       TOGGLE ACTIVO
       ══════════════════════════════════ */

    async toggleActivo(user: UsuarioStaff): Promise<void> {
        const yo = this.authService.currentUser();
        if (yo && yo.id === user.id) {
            this.errorGeneral = 'No puedes desactivar tu propia cuenta.';
            setTimeout(() => this.errorGeneral = '', 4000);
            return;
        }

        try {
            await this.staffService.toggleActivo(user.id, !user.activo);
            user.activo = !user.activo;
        } catch (e: any) {
            this.errorGeneral = e.message;
        }
    }

    /* ══════════════════════════════════
       HELPERS
       ══════════════════════════════════ */

    esMiUsuario(id: string): boolean {
        return this.authService.currentUser()?.id === id;
    }

    rolLabel(rol: RolStaff): string {
        const map: Record<RolStaff, string> = { admin: 'Admin', cajero: 'Cajero', cocina: 'Cocina', mesero: 'Mesero' };
        return map[rol] || rol;
    }
}
