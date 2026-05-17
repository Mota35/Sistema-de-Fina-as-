import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../core/services/transaction.service';
import { DashboardService } from '../core/services/domain.services';
import { ToastService } from '../core/services/toast.service';
import { DashboardSummary, MonthlyEvolution, CategorySummary } from '../core/models';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Relatórios</h1>
          <p class="page-subtitle">Análise detalhada das suas finanças</p>
        </div>
        <div class="header-actions">
          <select class="form-control" style="width:180px" [(ngModel)]="selectedMonth" (ngModelChange)="load()">
            @for (m of months; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
          </select>
          <button class="btn btn-outline" (click)="exportCsv()">⬇ CSV</button>
          <button class="btn btn-outline" (click)="exportPdf()">📄 PDF</button>
        </div>
      </div>

      <!-- KPI Row -->
      @if (loading()) {
        <div class="kpi-row stagger">
          @for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:100px;border-radius:16px"></div> }
        </div>
      } @else {
        <div class="kpi-row stagger animate-fade-in">
          <div class="stat-card">
            <span class="stat-icon">📥</span>
            <span class="stat-label">Receitas</span>
            <span class="stat-val income font-mono">{{ summary()?.total_income | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📤</span>
            <span class="stat-label">Despesas</span>
            <span class="stat-val expense font-mono">{{ summary()?.total_expense | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💰</span>
            <span class="stat-label">Saldo do Mês</span>
            <span class="stat-val font-mono" [class.income]="monthBalance() >= 0" [class.expense]="monthBalance() < 0">
              {{ monthBalance() | currency:'EUR':'symbol':'1.2-2':'pt' }}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📊</span>
            <span class="stat-label">Transações</span>
            <span class="stat-val font-mono">{{ summary()?.total_transactions ?? 0 }}</span>
          </div>
        </div>
      }

      <div class="reports-grid">
        <!-- Evolution Chart -->
        <div class="card">
          <div class="card-head">
            <h3>Evolução — Últimos 12 Meses</h3>
          </div>
          @if (loadingEvolution()) {
            <div class="skeleton" style="height:250px;border-radius:12px"></div>
          } @else {
            <div class="chart-area">
              @for (item of evolution(); track item.month) {
                <div class="bar-col">
                  <div class="bar-wrap">
                    <div class="bar income-bar" [style.height.%]="barH(item.income)"
                         [title]="item.income | currency:'EUR'"></div>
                    <div class="bar expense-bar" [style.height.%]="barH(item.expense)"
                         [title]="item.expense | currency:'EUR'"></div>
                  </div>
                  <span class="bar-lbl">{{ item.month | slice:5:7 }}/{{ item.month | slice:2:4 }}</span>
                </div>
              }
            </div>
            <div class="legend">
              <span class="leg-item"><span class="leg-dot" style="background:var(--clr-success)"></span>Receitas</span>
              <span class="leg-item"><span class="leg-dot" style="background:var(--clr-danger)"></span>Despesas</span>
            </div>
          }
        </div>

        <!-- Categories Breakdown -->
        <div class="card">
          <div class="card-head"><h3>Top Categorias de Despesa</h3></div>
          @if (loadingCat()) {
            <div class="skeleton" style="height:250px;border-radius:12px"></div>
          } @else if (topExpenses().length) {
            <div class="cat-breakdown">
              @for (cat of topExpenses(); track cat.name) {
                <div class="cat-row">
                  <div class="cat-info">
                    <span class="cat-ico">{{ cat.icon || '📦' }}</span>
                    <div>
                      <div class="cat-nm">{{ cat.name }}</div>
                      <div class="cat-cnt text-muted">{{ cat.count }} transações</div>
                    </div>
                  </div>
                  <div class="cat-right">
                    <span class="cat-amt font-mono">{{ cat.total | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
                    <span class="cat-pct text-muted">{{ catPct(cat.total) | number:'1.0-0' }}%</span>
                  </div>
                </div>
                <div class="progress-bar" style="margin:4px 0 8px">
                  <div class="progress-fill" style="background:var(--clr-danger)"
                       [style.width.%]="catPct(cat.total)"></div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:2rem">
              <div class="empty-state-icon">📊</div>
              <p class="empty-state-message">Sem dados para este mês</p>
            </div>
          }
        </div>
      </div>

      <!-- Monthly Comparison Table -->
      <div class="card">
        <div class="card-head"><h3>Comparativo Mensal</h3></div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th style="text-align:right">Receitas</th>
                <th style="text-align:right">Despesas</th>
                <th style="text-align:right">Saldo</th>
                <th style="text-align:right">Taxa Poupança</th>
              </tr>
            </thead>
            <tbody>
              @for (row of evolution(); track row.month) {
                <tr>
                  <td style="font-weight:500">{{ monthName(row.month) }}</td>
                  <td style="text-align:right">
                    <span class="font-mono" style="color:var(--clr-success)">
                      {{ row.income | currency:'EUR':'symbol':'1.2-2':'pt' }}
                    </span>
                  </td>
                  <td style="text-align:right">
                    <span class="font-mono" style="color:var(--clr-danger)">
                      {{ row.expense | currency:'EUR':'symbol':'1.2-2':'pt' }}
                    </span>
                  </td>
                  <td style="text-align:right">
                    <span class="font-mono" [style.color]="(row.income - row.expense) >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'">
                      {{ (row.income - row.expense) | currency:'EUR':'symbol':'1.2-2':'pt' }}
                    </span>
                  </td>
                  <td style="text-align:right">
                    <span [class]="savingsRateBadge(row.income, row.expense)">
                      {{ savingsRate(row.income, row.expense) | number:'1.0-1' }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-secondary); font-size:.9rem; }
    .header-actions { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }

    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:1.25rem; display:flex; flex-direction:column; gap:.375rem; }
    .stat-icon { font-size:1.375rem; }
    .stat-label { font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
    .stat-val { font-size:1.25rem; font-weight:700; }
    .stat-val.income { color:var(--clr-success); }
    .stat-val.expense { color:var(--clr-danger); }

    .reports-grid { display:grid; grid-template-columns:1.4fr 1fr; gap:1.25rem; margin-bottom:1.25rem; }

    .card { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.5rem; }
    .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
    .card-head h3 { font-size:1rem; font-weight:700; }

    /* Chart */
    .chart-area { display:flex; align-items:flex-end; gap:6px; height:230px; }
    .bar-col { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; height:100%; justify-content:flex-end; }
    .bar-wrap { display:flex; gap:3px; align-items:flex-end; flex:1; width:100%; }
    .bar { flex:1; border-radius:4px 4px 0 0; min-height:3px; transition:height .6s cubic-bezier(.16,1,.3,1); }
    .income-bar  { background:var(--clr-success); opacity:.85; }
    .expense-bar { background:var(--clr-danger); opacity:.75; }
    .bar-lbl { font-size:.6rem; color:var(--text-muted); white-space:nowrap; }
    .legend { display:flex; gap:1.25rem; margin-top:1rem; padding-top:.75rem; border-top:1px solid var(--border); }
    .leg-item { display:flex; align-items:center; gap:.375rem; font-size:.8rem; color:var(--text-secondary); }
    .leg-dot { width:10px; height:10px; border-radius:50%; }

    /* Cat breakdown */
    .cat-breakdown { display:flex; flex-direction:column; }
    .cat-row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:4px; }
    .cat-info { display:flex; align-items:center; gap:.625rem; }
    .cat-ico { font-size:1.125rem; }
    .cat-nm { font-size:.875rem; font-weight:500; }
    .cat-cnt { font-size:.75rem; }
    .cat-right { display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
    .cat-amt { font-size:.9rem; font-weight:700; }
    .cat-pct { font-size:.75rem; }

    @media (max-width:900px) { .reports-grid { grid-template-columns:1fr; } .kpi-row { grid-template-columns:1fr 1fr; } }
    @media (max-width:600px) { .kpi-row { grid-template-columns:1fr 1fr; } }
  `],
})
export class ReportsComponent implements OnInit {
  private txSvc   = inject(TransactionService);
  private dashSvc = inject(DashboardService);
  private toast   = inject(ToastService);

  summary         = signal<DashboardSummary | null>(null);
  evolution       = signal<MonthlyEvolution[]>([]);
  categoryData    = signal<CategorySummary[]>([]);
  loading         = signal(true);
  loadingEvolution = signal(true);
  loadingCat      = signal(true);

  selectedMonth = format(new Date(), 'yyyy-MM');
  months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy', { locale: pt }) };
  });

  monthBalance  = computed(() => (this.summary()?.total_income ?? 0) - (this.summary()?.total_expense ?? 0));
  topExpenses   = computed(() => this.categoryData().filter(c => c.type === 'expense').slice(0, 6));
  maxEvolution  = computed(() => Math.max(...this.evolution().flatMap(e => [e.income, e.expense]), 1));
  totalExpCats  = computed(() => this.topExpenses().reduce((s, c) => s + c.total, 0));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.dashSvc.summary(this.selectedMonth).subscribe({
      next: r => { this.summary.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.loadingEvolution.set(true);
    this.dashSvc.evolution(12).subscribe({
      next: r => { this.evolution.set(r.data); this.loadingEvolution.set(false); },
      error: () => this.loadingEvolution.set(false),
    });

    this.loadingCat.set(true);
    this.dashSvc.byCategory(this.selectedMonth).subscribe({
      next: r => { this.categoryData.set(r.data); this.loadingCat.set(false); },
      error: () => this.loadingCat.set(false),
    });
  }

  barH(val: number): number { return Math.max(3, (val / this.maxEvolution()) * 100); }
  catPct(total: number): number { return this.totalExpCats() ? (total / this.totalExpCats()) * 100 : 0; }
  savingsRate(income: number, expense: number): number { return income ? Math.max(0, ((income - expense) / income) * 100) : 0; }
  savingsRateBadge(income: number, expense: number): string {
    const r = this.savingsRate(income, expense);
    return r >= 20 ? 'badge badge-success' : r > 0 ? 'badge badge-warning' : 'badge badge-danger';
  }
  monthName(m: string): string {
    try { return format(new Date(m + '-01'), 'MMMM yyyy', { locale: pt }); } catch { return m; }
  }

  exportCsv(): void {
    this.txSvc.exportCsv({ date_from: this.selectedMonth + '-01', date_to: this.selectedMonth + '-31' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = `relatorio-${this.selectedMonth}.csv`; a.click();
        URL.revokeObjectURL(url);
        this.toast.success('CSV exportado!');
      },
      error: () => this.toast.error('Erro ao exportar CSV'),
    });
  }

  exportPdf(): void {
    // Build a simple printable PDF using browser print
    const s    = this.summary();
    const win  = window.open('', '_blank')!;
    const rows = this.evolution().map(e =>
      `<tr><td>${this.monthName(e.month)}</td><td>€${e.income.toFixed(2)}</td><td>€${e.expense.toFixed(2)}</td><td>€${(e.income - e.expense).toFixed(2)}</td></tr>`
    ).join('');
    win.document.write(`
      <html><head><title>Relatório ${this.selectedMonth}</title>
      <style>body{font-family:sans-serif;padding:2rem;color:#111}h1{color:#6C63FF}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem .75rem;text-align:left}th{background:#f5f5f5}</style>
      </head><body>
      <h1>Relatório Financeiro — ${this.monthName(this.selectedMonth)}</h1>
      <p>Receitas: <strong>€${s?.total_income?.toFixed(2) ?? '0.00'}</strong> &nbsp;|&nbsp;
         Despesas: <strong>€${s?.total_expense?.toFixed(2) ?? '0.00'}</strong> &nbsp;|&nbsp;
         Saldo: <strong>€${this.monthBalance().toFixed(2)}</strong></p>
      <h2>Evolução Mensal</h2>
      <table><thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:2rem;color:#999;font-size:.8rem">Gerado em ${new Date().toLocaleString('pt')}</p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
    this.toast.success('PDF gerado!');
  }
}
