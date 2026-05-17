import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">💰</div>
          <h1 class="brand-title">FinancePro</h1>
          <p class="brand-subtitle">Gestão financeira inteligente para um futuro melhor.</p>

          <div class="brand-stats stagger animate-fade-in">
            <div class="stat-item">
              <span class="stat-value">98%</span>
              <span class="stat-label">Satisfação</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">50k+</span>
              <span class="stat-label">Utilizadores</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">€2M+</span>
              <span class="stat-label">Geridos</span>
            </div>
          </div>

          <div class="brand-testimonial animate-fade-in" style="animation-delay:300ms">
            <p>"Finalmente entendo para onde vai o meu dinheiro cada mês."</p>
            <span>— Ana Costa, Lisboa</span>
          </div>
        </div>

        <!-- Decorative orbs -->
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    /* ─── Brand Panel ─── */
    .auth-brand {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: #fff;
      max-width: 380px;
    }

    .brand-logo {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      filter: drop-shadow(0 0 20px rgba(255,255,255,.3));
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -.03em;
      margin-bottom: .5rem;
    }

    .brand-subtitle {
      color: rgba(255,255,255,.65);
      font-size: 1.05rem;
      margin-bottom: 3rem;
      line-height: 1.6;
    }

    .brand-stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin-bottom: 3rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-value {
      font-family: var(--font-mono);
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: .75rem;
      color: rgba(255,255,255,.55);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .brand-testimonial {
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      backdrop-filter: blur(8px);
    }

    .brand-testimonial p {
      font-style: italic;
      color: rgba(255,255,255,.85);
      margin-bottom: .5rem;
      font-size: .95rem;
    }

    .brand-testimonial span {
      font-size: .8rem;
      color: rgba(255,255,255,.5);
    }

    /* Decorative orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      pointer-events: none;
    }
    .orb-1 {
      width: 300px; height: 300px;
      background: rgba(99,102,241,.3);
      top: -80px; right: -60px;
    }
    .orb-2 {
      width: 200px; height: 200px;
      background: rgba(139,92,246,.25);
      bottom: 60px; left: -40px;
    }
    .orb-3 {
      width: 150px; height: 150px;
      background: rgba(59,130,246,.2);
      bottom: 30%; right: 20%;
    }

    /* ─── Content Panel ─── */
    .auth-content {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--bg-base);
      overflow-y: auto;
    }

    /* ─── Responsive ─── */
    @media (max-width: 900px) {
      .auth-shell { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `],
})
export class AuthLayoutComponent {}
