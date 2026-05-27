import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccountService, TransferService, UserService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Account, User } from '../../core/models';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe, RouterModule, TranslatePipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">
  
  <!-- Back Button & Title -->
  <div class="flex items-center gap-4 mb-8">
    <button routerLink="/app/accounts" 
            class="p-2.5 rounded-xl border transition-all"
            [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        {{ account()?.name || ('common.loading' | translate) }}
      </h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ 'acc.detail_subtitle' | translate }}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Left Column: Account Info -->
    <div class="lg:col-span-1 flex flex-col gap-6">
      <div class="p-6 rounded-3xl border shadow-sm"
           [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'">
        
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">{{ 'acc.balance' | translate }}</p>
            <p class="text-xl lg:text-2xl font-black truncate max-w-[200px]" 
               [title]="(account()?.balance || 0) | money"
               [class]="(account()?.balance || 0) >= 0 ? (theme.isDark() ? 'text-white' : 'text-slate-900') : 'text-red-500'">
              {{ account()?.balance | money }}
            </p>
          </div>
        </div>

        <div class="space-y-4 pt-4 border-t border-dashed" [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-500">{{ 'common.type' | translate }}</span>
            <span class="text-xs font-bold" [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-700'">{{ account()?.type }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-500">{{ 'acc.id_conta' | translate }}</span>
            <span class="text-xs font-mono font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg">
              #{{ user()?.id_conta }}
            </span>
          </div>
          <div *ngIf="account()?.is_default_receiving" class="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
            Principal para recebimentos
          </div>
          <button *ngIf="!account()?.is_default_receiving" (click)="setAsDefault()"
                  class="w-full text-[10px] font-bold py-2 rounded-xl border border-dashed transition-all"
                  [class]="theme.isDark() ? 'border-slate-700 text-slate-500 hover:border-amber-500 hover:text-amber-500' : 'border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500'">
            Definir como principal para recebimentos
          </button>
        </div>

        <button (click)="openTransferModal()"
                class="w-full mt-8 inline-flex items-center justify-center gap-2 font-extrabold text-sm px-5 py-4 rounded-2xl shadow-lg transition-all"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          {{ 'acc.send_money' | translate }}
        </button>
      </div>
    </div>

    <!-- Right Column: History -->
    <div class="lg:col-span-2">
      <div class="p-6 rounded-3xl border shadow-sm min-h-[500px]"
           [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'">
        
        <h3 class="text-base font-black mb-6" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ 'acc.history' | translate }}</h3>

        <div *ngIf="loadingHistory()" class="space-y-4">
          <div *ngFor="let i of [1,2,3,4,5]" class="h-16 rounded-2xl animate-pulse" [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-50'"></div>
        </div>

        <div *ngIf="!loadingHistory() && history().length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 opacity-20" [class]="theme.isDark() ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p class="text-sm font-bold text-slate-400">{{ 'acc.no_history' | translate }}</p>
        </div>

        <div *ngIf="!loadingHistory() && history().length > 0" class="space-y-3">
          <div *ngFor="let item of history()" 
               class="flex items-center justify-between p-4 rounded-2xl border transition-all"
               [class]="theme.isDark() ? 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 shadow-sm'">
            
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                   [class]="item.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'">
                <svg *ngIf="item.type === 'income'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
                <svg *ngIf="item.type === 'expense'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ item.description || ('common.no_description' | translate) }}</p>
                  <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 tracking-tighter">{{ item.origin }}</span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] text-slate-500">{{ item.date | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span *ngIf="item.origin === 'transfer'" class="text-[10px] font-bold text-blue-500">
                    {{ item.type === 'income' ? ('common.from' | translate) + ': ' + (item.sender_name || 'Usuário') : ('common.to' | translate) + ': ' + (item.receiver_name || 'Usuário') }}
                  </span>
                  <span *ngIf="item.origin === 'transaction'" class="text-[10px] font-bold text-slate-400">
                    {{ item.category_name }}
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <p class="text-sm font-black" [class]="item.type === 'income' ? 'text-emerald-500' : 'text-red-500'">
                {{ (item.type === 'income' ? '+' : '-') }} {{ item.amount | money }}
              </p>
              <p *ngIf="item.origin === 'transfer'" class="text-[9px] font-mono text-slate-500">
                #{{ item.type === 'income' ? item.sender_id_conta : item.receiver_id_conta }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Transfer Modal -->
<div *ngIf="transferModalOpen()" class="overlay items-center justify-center" (click)="closeTransferModal()">
  <div class="w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-black mb-4" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ 'acc.transfer_modal_title' | translate }}</h3>

    <div *ngIf="transferError()" class="p-3 rounded-xl text-xs mb-4"
         [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">{{ transferError() }}</div>
    
    <div *ngIf="transferSuccess()" class="p-3 rounded-xl text-xs mb-4"
         [class]="theme.isDark() ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'">{{ 'acc.success_transfer' | translate }}</div>

    <form (ngSubmit)="sendMoney()" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'acc.recipient_label' | translate }}</label>
        <input type="text" [(ngModel)]="transferForm.recipient" name="recipient" required [placeholder]="'acc.recipient_placeholder' | translate" class="input-base"/>
      </div>
      
      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'acc.amount_label' | translate }}</label>
        <div class="relative">
          <input type="number" [(ngModel)]="transferForm.amount" name="amount" required step="0.01" min="0.01" placeholder="0.00" class="input-base pr-12"/>
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">AOA</span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'acc.description_label' | translate }}</label>
        <input type="text" [(ngModel)]="transferForm.description" name="description" [placeholder]="'common.notes_placeholder' | translate" class="input-base"/>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="button" (click)="closeTransferModal()"
                class="flex-1 py-3 rounded-xl border text-xs font-semibold transition-all"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
          {{ 'common.cancel' | translate }}
        </button>
        <button type="submit" [disabled]="sendingMoney()"
                class="flex-1 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
          {{ (sendingMoney() ? 'acc.sending' : 'acc.confirm_send') | translate }}
        </button>
      </div>
    </form>
  </div>
</div>
  `
})
export class AccountDetailComponent implements OnInit {
  theme = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accSvc = inject(AccountService);
  private transferSvc = inject(TransferService);
  private userSvc = inject(UserService);

  account = signal<Account | null>(null);
  user = signal<User | null>(null);
  history = signal<any[]>([]);
  loadingHistory = signal(true);

  transferModalOpen = signal(false);
  sendingMoney = signal(false);
  transferError = signal('');
  transferSuccess = signal('');
  transferForm = { recipient: '', amount: 0, description: '' };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/app/accounts']);
      return;
    }
    this.loadAccount(id);
    this.loadUser();
    this.loadHistory(id);
  }

  loadAccount(id: number): void {
    this.accSvc.get(id).subscribe(r => {
      if (r.success) this.account.set(r.data);
    });
  }

  loadUser(): void {
    this.userSvc.getProfile().subscribe(r => {
      if (r.success) this.user.set(r.data);
    });
  }

  loadHistory(id: number): void {
    this.loadingHistory.set(true);
    this.accSvc.history(id, 1, 50).subscribe(r => {
      if (r.success) this.history.set(r.data);
      this.loadingHistory.set(false);
    });
  }

  openTransferModal(): void {
    this.transferForm = { recipient: '', amount: 0, description: '' };
    this.transferError.set('');
    this.transferSuccess.set('');
    this.transferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.transferModalOpen.set(false);
  }

  setAsDefault(): void {
    if (!this.account()) return;
    this.accSvc.setDefault(this.account()!.id).subscribe(r => {
      if (r.success) this.loadAccount(this.account()!.id);
    });
  }

  sendMoney(): void {
    if (!this.account()) return;
    
    this.sendingMoney.set(true);
    this.transferError.set('');
    this.transferSuccess.set('');

    const data = {
      sender_account_id: this.account()!.id,
      recipient: this.transferForm.recipient,
      amount: this.transferForm.amount,
      description: this.transferForm.description
    };

    this.transferSvc.transfer(data).subscribe({
      next: r => {
        if (r.success) {
          this.transferSuccess.set('success');
          this.loadAccount(this.account()!.id);
          this.loadHistory(this.account()!.id);
          setTimeout(() => this.closeTransferModal(), 2000);
        } else {
          this.transferError.set(r.message);
        }
        this.sendingMoney.set(false);
      },
      error: e => {
        this.transferError.set(e.error?.message || 'Erro ao realizar transferência.');
        this.sendingMoney.set(false);
      }
    });
  }
}
