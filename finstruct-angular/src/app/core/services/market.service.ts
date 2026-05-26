import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';

export interface AssetQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap?: number;
  type: 'crypto' | 'stock' | 'forex';
  chartData: number[];
  chartLabels: string[];
  lastUpdated: string;
}

/* ─── Free public APIs used ────────────────────────────────────────────────────
   Crypto  → CoinGecko (free, no key needed, 30 calls/min)
   Forex   → Open Exchange Rates via exchangerate-api (key from .env)
   Stocks  → Yahoo Finance (unofficial public JSON, no key)
────────────────────────────────────────────────────────────────────────────── */

const COINGECKO = 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin',
  SOL: 'solana', ADA: 'cardano', DOGE: 'dogecoin',
  XRP: 'ripple', AVAX: 'avalanche-2', MATIC: 'matic-network',
  DOT: 'polkadot', LTC: 'litecoin', LINK: 'chainlink',
};

@Injectable({ providedIn: 'root' })
export class MarketService {
  constructor(private http: HttpClient) {}

  // ─── CoinGecko: current prices for multiple coins ──────────────────────────
  getCryptoPrices(symbols: string[], vsCurrency = 'usd'): Observable<AssetQuote[]> {
    const ids = symbols.map(s => COIN_IDS[s.toUpperCase()] ?? s.toLowerCase()).join(',');
    const url = `${COINGECKO}/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

    return this.http.get<any[]>(url).pipe(
      map(coins => coins.map(c => ({
        symbol:        c.symbol.toUpperCase(),
        name:          c.name,
        price:         c.current_price,
        change:        c.price_change_24h ?? 0,
        changePercent: c.price_change_percentage_24h ?? 0,
        high24h:       c.high_24h,
        low24h:        c.low_24h,
        volume:        c.total_volume,
        marketCap:     c.market_cap,
        type:          'crypto' as const,
        chartData:     c.sparkline_in_7d?.price ?? [],
        chartLabels:   [],
        lastUpdated:   new Date().toISOString(),
      }))),
      catchError(() => of([]))
    );
  }

  // ─── CoinGecko: 7-day OHLC chart for a single coin ────────────────────────
  getCryptoChart(symbol: string, days = 7, vsCurrency = 'usd'): Observable<{prices:number[];labels:string[]}> {
    const id = COIN_IDS[symbol.toUpperCase()] ?? symbol.toLowerCase();
    const url = `${COINGECKO}/coins/${id}/market_chart?vs_currency=${vsCurrency}&days=${days}`;

    return this.http.get<any>(url).pipe(
      map(data => {
        const prices: number[] = (data.prices ?? []).map((p: number[]) => p[1]);
        const labels: string[] = (data.prices ?? []).map((p: number[]) => {
          const d = new Date(p[0]);
          return days <= 1
            ? d.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('pt', { month: 'short', day: 'numeric' });
        });
        return { prices, labels };
      }),
      catchError(() => of({ prices: [], labels: [] }))
    );
  }

  // ─── CoinGecko: trending coins ────────────────────────────────────────────
  getTrending(): Observable<any[]> {
    return this.http.get<any>(`${COINGECKO}/search/trending`).pipe(
      map(d => d.coins?.slice(0, 6) ?? []),
      catchError(() => of([]))
    );
  }

  // ─── CoinGecko: global market data ────────────────────────────────────────
  getGlobalData(): Observable<any> {
    return this.http.get<any>(`${COINGECKO}/global`).pipe(
      map(d => d.data ?? {}),
      catchError(() => of({}))
    );
  }

  // ─── CoinGecko: search coins ──────────────────────────────────────────────
  searchCoins(query: string): Observable<any[]> {
    return this.http.get<any>(`${COINGECKO}/search?query=${query}`).pipe(
      map(d => d.coins?.slice(0, 8) ?? []),
      catchError(() => of([]))
    );
  }

  // ─── Sparkline path from price array (for SVG) ───────────────────────────
  buildSparklinePath(prices: number[], width = 120, height = 40): string {
    if (!prices.length) return '';
    const min  = Math.min(...prices);
    const max  = Math.max(...prices);
    const range = max - min || 1;
    const step  = width / (prices.length - 1);
    return prices.map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }

  buildAreaPath(prices: number[], width = 120, height = 40): string {
    const line = this.buildSparklinePath(prices, width, height);
    if (!line) return '';
    return `${line} L${width} ${height} L0 ${height} Z`;
  }

  // ─── Chart path for full chart panel ─────────────────────────────────────
  buildChartPath(prices: number[], w = 500, h = 180, area = false): string {
    if (!prices.length) return '';
    const min  = Math.min(...prices);
    const max  = Math.max(...prices);
    const range = max - min || 1;
    const step  = w / (prices.length - 1 || 1);
    const pts = prices.map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * (h - 20) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return area ? `${pts} L${w} ${h} L0 ${h} Z` : pts;
  }
}
