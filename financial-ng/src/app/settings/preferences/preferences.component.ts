import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { STORAGE_KEYS } from '../../core/constants/api.constants';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="settings-layout animate-fade-in">
      <aside class="settings-nav">
        <h2>Configurações</h2>
        <nav>
          <a class="snav-link" routerLink="../profile"     routerLinkActive="active">👤 Perfil</a>
          <a class="snav-link" routerLink="../preferences" routerLinkActive="active">🎨 Preferências</a>
          <a class="snav-link" routerLink="../security"    routerLinkActive="active">🔒 Segurança</a>
        </nav>
      </aside>

      <div class="settings-content">
        <h1 class="page-title">Preferências</h1>
        <p class="page-subtitle">Personalizar a sua experiência na aplicação</p>

        <!-- Theme -->
        <div class="card">
          <h3 class="section-title">Aparência</h3>
          <div class="pref-row">
            <div>
              <div class="pref-label">Tema</div>
              <div class="pref-desc text-secondary">Escolha entre tema claro ou escuro</div>
            </div>
            <div class="theme-toggle-row">
              <button class="theme-btn" [class.active]="!theme.isDark()" (click)="theme.setTheme('light')">
                ☀️ Claro
              </button>
              <button class="theme-btn" [class.active]="theme.isDark()" (click)="theme.setTheme('dark')">
                🌙 Escuro
              </button>
            </div>
          </div>
        </div>

        <!-- Language -->
        <div class="card">
          <h3 class="section-title">Idioma e Região</h3>
          <div class="pref-grid">
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select class="form-control" [(ngModel)]="language" (ngModelChange)="saveLang()">
                <option value="pt">🇵🇹 Português</option>
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Moeda</label>
              <select class="form-control" [(ngModel)]="currency" (ngModelChange)="saveCurrency()">
                <option value="EUR">€ Euro (EUR)</option>
                <option value="BRL">R$ Real (BRL)</option>
                <option value="USD">$ Dólar (USD)</option>
                <option value="GBP">£ Libra (GBP)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Formato de Data</label>
              <select class="form-control" [(ngModel)]="dateFormat" (ngModelChange)="saveDateFormat()">
                <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                <option value="yyyy-MM-dd">AAAA-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="card">
          <h3 class="section-title">Notificações</h3>
          <div class="toggle-list">
            @for (n of notifications; track n.key) {
              <div class="toggle-row">
                <div>
                  <div class="pref-label">{{ n.label }}</div>
                  <div class="pref-desc text-secondary">{{ n.desc }}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="n.enabled" (ngModelChange)="saveNotification(n)">
                  <span class="switch-track"></span>
                </label>
              </div>
            }
          </div>
        </div>

        <div class="save-bar animate-fade-in">
          <button class="btn btn-primary" (click)="saveAll()">💾 Guardar Preferências</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-layout { display:grid; grid-template-columns:220px 1fr; gap:1.5rem; align-items:start; }
    .settings-nav { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.25rem; position:sticky; top:80px; }
    .settings-nav h2 { font-size:.8rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:1rem; }
    .snav-link { display:flex; align-items:center; gap:.625rem; padding:.625rem .875rem; border-radius:var(--radius-md); font-size:.875rem; font-weight:500; color:var(--text-secondary); text-decoration:none; transition:all var(--transition); margin-bottom:2px; }
    .snav-link:hover { background:var(--bg-surface2); color:var(--text-primary); }
    .snav-link.active { background:var(--clr-primary-glow); color:var(--clr-primary); }

    .settings-content { display:flex; flex-direction:column; gap:1.25rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-secondary); font-size:.9rem; margin-bottom:0; }

    .card { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.5rem; }
    .section-title { font-size:1rem; font-weight:700; margin-bottom:1.25rem; }

    .pref-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
    .pref-label { font-size:.9375rem; font-weight:500; }
    .pref-desc { font-size:.8125rem; margin-top:2px; }
    .theme-toggle-row { display:flex; gap:.5rem; }
    .theme-btn { padding:.5rem 1rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-surface2); cursor:pointer; font-size:.875rem; font-weight:500; transition:all var(--transition); color:var(--text-secondary); }
    .theme-btn:hover { border-color:var(--clr-primary); }
    .theme-btn.active { background:var(--clr-primary); border-color:var(--clr-primary); color:#fff; }

    .pref-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; }

    .toggle-list { display:flex; flex-direction:column; gap:1rem; }
    .toggle-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.625rem 0; border-bottom:1px solid var(--border); }
    .toggle-row:last-child { border-bottom:none; }

    /* Toggle Switch */
    .switch { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; }
    .switch input { opacity:0; width:0; height:0; }
    .switch-track { position:absolute; inset:0; background:var(--border); border-radius:99px; cursor:pointer; transition:background var(--transition); }
    .switch-track::before { content:''; position:absolute; width:18px; height:18px; left:3px; top:3px; background:#fff; border-radius:50%; transition:transform var(--transition); }
    input:checked + .switch-track { background:var(--clr-primary); }
    input:checked + .switch-track::before { transform:translateX(20px); }

    .save-bar { display:flex; justify-content:flex-end; }
    @media (max-width:768px) { .settings-layout { grid-template-columns:1fr; } .settings-nav { position:static; } }
  `],
})
export class PreferencesComponent {
  theme = inject(ThemeService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  language   = localStorage.getItem(STORAGE_KEYS.LANGUAGE) ?? 'pt';
  currency   = localStorage.getItem('fp_currency') ?? 'EUR';
  dateFormat = localStorage.getItem('fp_date_format') ?? 'dd/MM/yyyy';

  notifications = [
    { key: 'budget_alert',    label: 'Alertas de Orçamento',     desc: 'Notificar quando 80% do orçamento for utilizado', enabled: true },
    { key: 'goal_progress',   label: 'Progresso de Metas',       desc: 'Notificar ao atingir marcos importantes', enabled: true },
    { key: 'monthly_report',  label: 'Relatório Mensal',         desc: 'Resumo mensal das suas finanças por email', enabled: false },
    { key: 'large_tx',        label: 'Transações de Valor Alto', desc: 'Alertar quando há transações acima de €500', enabled: true },
  ];

  saveLang(): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, this.language);
    window.location.href = '/app/settings/preferences';  // ← força reload completo na rota certa
  }
  saveCurrency():   void { localStorage.setItem('fp_currency', this.currency); }
  saveDateFormat(): void { localStorage.setItem('fp_date_format', this.dateFormat); }
  saveNotification(n: any): void { localStorage.setItem('fp_notif_' + n.key, String(n.enabled)); }

  saveAll(): void {
    this.saveCurrency();
    this.saveDateFormat();
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, this.language);
    this.toast.success('Preferências guardadas!');
    setTimeout(() => {
      window.location.href = '/app/settings/preferences';
    }, 800);
  }
}
