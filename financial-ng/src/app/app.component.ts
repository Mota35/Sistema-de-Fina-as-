import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';
import { STORAGE_KEYS } from './core/constants/api.constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);
  private theme     = inject(ThemeService); // initialises theme effect

  ngOnInit(): void {
    const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) ?? 'pt';
    this.translate.setDefaultLang('pt');
    this.translate.use(lang);
  }
}
