import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal<boolean>(this.loadTheme());

  toggle(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    this.applyTheme(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  init(): void { this.applyTheme(this.isDark()); }

  private applyTheme(dark: boolean): void {
    const body = document.body;
    const html  = document.documentElement;
    if (dark) {
      body.classList.remove('light-mode');
      html.classList.add('dark');
    } else {
      body.classList.add('light-mode');
      html.classList.remove('dark');
    }
  }

  private loadTheme(): boolean {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  }
}
