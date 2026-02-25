import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolStaff } from '../../core/models/usuario-staff.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    isLoading = false;
    errorMessage = '';
    showPassword = false;

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { email, password } = this.loginForm.value;

        try {
            await this.authService.login(email, password);
            const rol = this.authService.rol;
            if (rol) {
                this.redirigirPorRol(rol);
            }
        } catch (error: any) {
            this.errorMessage = this.mapearError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    private redirigirPorRol(rol: RolStaff): void {
        switch (rol) {
            case 'admin':
            case 'cajero':
                this.router.navigate(['/admin/dashboard']);
                break;
            case 'cocina':
                this.router.navigate(['/kds']);
                break;
            case 'mesero':
                this.router.navigate(['/admin/mesas']);
                break;
        }
    }

    private mapearError(mensaje: string): string {
        if (mensaje.includes('desactivada') || mensaje.includes('perfil de staff')) {
            return 'Usuario inactivo o sin acceso al sistema.';
        }
        if (mensaje.includes('Credenciales incorrectas')) {
            return 'Credenciales incorrectas. Verifica tu email y contraseña.';
        }
        return 'Error de conexión. Intenta de nuevo.';
    }
}
