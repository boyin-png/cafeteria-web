import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="unauth-container">
      <div class="unauth-card">
        <div style="margin-bottom: 1rem;"><lucide-icon name="lock" [size]="48" color="var(--color-primary-light)"></lucide-icon></div>
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <a routerLink="/login" class="btn-back">Volver al inicio</a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f3f4f6;
    }
    .unauth-card {
      text-align: center;
      padding: 2.5rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      max-width: 380px;
    }
    .unauth-icon { font-size: 3rem; }
    h1 { margin: 0.75rem 0 0.5rem; font-size: 1.375rem; color: #1a1a2e; }
    p { margin: 0 0 1.25rem; color: #6b7280; font-size: 0.9375rem; }
    .btn-back {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: #1B4F8A;
      color: #fff;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .btn-back:hover { background: #163f6e; }
  `]
})
export class UnauthorizedComponent { }
