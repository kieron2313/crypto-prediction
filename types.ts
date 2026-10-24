export enum TrendDirection {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
}

export interface PortfolioItem {
  symbol: string;
  amount: number;
  avgBuyPrice: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  amount: number;
  price: number;
  date: string;
}

export interface AdSpaceConfig {
  id: string;
  name: string;
  type: 'DEFAULT' | 'BANNER' | 'CODE';
  bannerUrl?: string;
  linkUrl?: string;
  customCode?: string;
  active: boolean;
  impressions: number; // Mock stat
}

export interface Notification {
  id: string;
  type: 'BROADCAST' | 'SIGNAL';
  title: string;
  message: string;
  timestamp: number; // ms
  read?: boolean; // Client-side flag helper
}

export interface User {
  uid?: string; // Firebase Auth ID
  email: string;
  name: string;
  balance: number;
  portfolio: PortfolioItem[];
  watchlist: string[]; // List of symbols
  transactions: Transaction[];
  isAdmin?: boolean;
  lastReadNotifyTime?: number;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  marketCap: string;
  volatility: string; // 'High' | 'Medium' | 'Low'
  sentiment: {
    score: number; // 0-100
    headline: string;
  };
  technicalIndicators: {
    rsi: number;
    macd: string; // 'Positive' | 'Negative'
    movingAverage50: number;
  };
  priceHistory: number[]; // For chart
}

export interface AIPrediction {
  symbol: string;
  trend: TrendDirection;
  confidence: number; // 0-100
  reasoning: string;
  keyLevel: string; // Support/Resistance
}

export interface CoinAnalysis extends MarketData {
  prediction?: AIPrediction;
  isAnalyzing?: boolean;
}

// DexScreener Interfaces
export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}