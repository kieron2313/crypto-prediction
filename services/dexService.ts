import { DexPair } from '../types';

const BASE_URL = 'https://api.dexscreener.com/latest/dex';

// We search for generic terms associated with moonshots or specific chains to populate the "Gem Hunter" list
const SEARCH_QUERIES = [
  'solana', 
  'base', 
  'meme', 
  'pepe', 
  'doge', 
  'moon', 
  'ai', 
  'trump'
];

export const fetchDexPairs = async (): Promise<DexPair[]> => {
  try {
    // Fetch multiple queries in parallel to get a diverse list of volatile assets
    const promises = SEARCH_QUERIES.map(q => 
      fetch(`${BASE_URL}/search?q=${q}`).then(res => res.json())
    );

    const results = await Promise.all(promises);
    
    // Aggregate and deduplicate pairs
    const allPairs: DexPair[] = [];
    const seenAddresses = new Set<string>();

    results.forEach((data: any) => {
      if (data.pairs) {
        data.pairs.forEach((pair: DexPair) => {
          if (!seenAddresses.has(pair.pairAddress)) {
            // Filter for meaningful liquidity to avoid pure junk
            if (pair.liquidity && pair.liquidity.usd > 10000) {
                allPairs.push(pair);
                seenAddresses.add(pair.pairAddress);
            }
          }
        });
      }
    });

    // Sort by 24h volume initially
    return allPairs.sort((a, b) => b.volume.h24 - a.volume.h24);

  } catch (error) {
    console.error("DexScreener API Error:", error);
    return [];
  }
};