import { MarketData, TrendDirection, CoinAnalysis } from './types';

const REQUESTED_SYMBOLS = [
  'BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'SOL', 'DOT', 'DOGE', 'SHIB', 
  'AVAX', 'POL', 'XLM', 'TRX', 'AAVE', 'ALGO', 'APE', 'ARB', 'APT', 'BAL', 
  'BNT', 'BONK', 'TIA', 'LINK', 'CHZ', 'ATOM', 'CRO', 'CRV', 'DASH', 'ENA', 
  'ETC', 'FET', 'FIL', 'FLR', 'GRT', 'HBAR', 'IMX', 'INJ', 'ICP', 'JUP', 
  'LDO', 'LRC', 'MKR', 'NMR', 'ONDO', 'OP', 'OXT', 'PEPE', 'PERP', 'QNT', 
  'RENDER', 'SEI', 'STX', 'SUI', 'SNX', 'XTZ', 'UMA', 'UNI', 'VET', 'WLD', 
  'YFI', 'ZRX', '1INCH', 'XYO'
];

// Helper to generate consistent mock data based on symbol hash
const generateMockData = (symbol: string): MarketData & { prediction?: any } => {
  // Simple hash for consistency
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = (hash * 12.5) % 1000 + (hash % 2 === 0 ? 0.5 : 10);
  
  // Custom overrides for major coins to look realistic
  let finalPrice = basePrice;
  let name = symbol + " Token";
  
  if (symbol === 'BTC') { finalPrice = 64230.50; name = "Bitcoin"; }
  else if (symbol === 'ETH') { finalPrice = 3450.12; name = "Ethereum"; }
  else if (symbol === 'SOL') { finalPrice = 145.80; name = "Solana"; }
  else if (symbol === 'DOGE') { finalPrice = 0.16; name = "Dogecoin"; }
  else if (symbol === 'SHIB') { finalPrice = 0.00002; name = "Shiba Inu"; }
  else if (symbol === 'PEPE') { finalPrice = 0.000008; name = "Pepe"; }
  
  const isPositive = hash % 2 === 0;
  const change = (hash % 100) / 10 * (isPositive ? 1 : -1);
  const rsi = 30 + (hash % 60);

  const marketData: MarketData = {
    id: symbol.toLowerCase(),
    symbol,
    name: name === symbol + " Token" ? getNameMap(symbol) : name,
    price: finalPrice,
    change24h: parseFloat(change.toFixed(2)),
    volume24h: `$${(hash * 2)}M`,
    marketCap: `$${(hash * 15)}M`,
    volatility: rsi > 70 || rsi < 30 ? 'High' : 'Medium',
    sentiment: { 
      score: rsi, 
      headline: getHeadline(symbol, isPositive) 
    },
    technicalIndicators: { 
      rsi, 
      macd: isPositive ? 'Positive' : 'Negative', 
      movingAverage50: finalPrice * (isPositive ? 0.95 : 1.05) 
    },
    priceHistory: Array.from({ length: 10 }, (_, i) => finalPrice * (1 + (Math.sin(i + hash) * 0.05))),
  };

  // Add fake "Pre-scanned" predictions for a few coins to populate Signals page immediately
  if (['BTC', 'SOL', 'PEPE', 'LINK', 'FET', 'RNDR', 'INJ'].includes(symbol)) {
    return {
        ...marketData,
        prediction: {
            symbol,
            trend: isPositive ? TrendDirection.BULLISH : TrendDirection.BEARISH,
            confidence: 85 + (hash % 10),
            reasoning: isPositive 
                ? "Breakout above key resistance confirmed by volume expansion and strong institutional accumulation sentiment."
                : "Failed to hold support level. Bearish divergence on RSI suggests further downside momentum.",
            keyLevel: isPositive ? `$${(finalPrice * 0.9).toFixed(2)}` : `$${(finalPrice * 1.1).toFixed(2)}`
        }
    }
  }

  return marketData;
};

const getNameMap = (s: string) => {
  const map: Record<string, string> = {
    'POL': 'Polygon', 'AVAX': 'Avalanche', 'XRP': 'Ripple', 'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash', 'DOT': 'Polkadot', 'XLM': 'Stellar', 'TRX': 'Tron',
    'UNI': 'Uniswap', 'LINK': 'Chainlink', 'ATOM': 'Cosmos', 'ICP': 'Internet Computer',
    'RNDR': 'Render', 'FET': 'Fetch.ai', 'INJ': 'Injective'
  };
  return map[s] || s + " Network";
}

const getHeadline = (symbol: string, isPositive: boolean) => {
  const pos = [
    `Institutions accumulating ${symbol} aggressively`,
    `${symbol} network activity hits all-time high`,
    `Major partnership announced for ${symbol} ecosystem`,
    `Bullish chart pattern confirmed for ${symbol}`
  ];
  const neg = [
    `Regulatory concerns weigh on ${symbol}`,
    `Short term correction expected for ${symbol}`,
    `Network congestion spikes fees on ${symbol}`,
    `${symbol} faces resistance at key levels`
  ];
  return isPositive 
    ? pos[Math.floor(Math.random() * pos.length)]
    : neg[Math.floor(Math.random() * neg.length)];
}

export const INITIAL_MARKET_DATA: CoinAnalysis[] = REQUESTED_SYMBOLS.map(generateMockData);

export const MOCK_LOGS = [
  "Initializing neural network...",
  "Connecting to distributed exchange nodes...",
  "Fetching real-time price feeds...",
  "Aggregating social sentiment data...",
  "Calculating RSI & MACD divergences...",
  "Synthesizing Gemini 3 Pro predictions...",
];