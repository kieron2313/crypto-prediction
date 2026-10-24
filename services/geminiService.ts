import { GoogleGenAI, Type } from "@google/genai";
import { MarketData, AIPrediction, TrendDirection, DexPair } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const scanMarketWithGemini = async (marketData: MarketData[]): Promise<AIPrediction[]> => {
  const ai = getClient();

  // Construct a prompt that includes the technical data AND sentiment
  const dataSummary = marketData.map(coin => 
    `Symbol: ${coin.symbol}
     Price: $${coin.price}
     24h Change: ${coin.change24h}%
     RSI: ${coin.technicalIndicators.rsi}
     MACD: ${coin.technicalIndicators.macd}
     50MA: ${coin.technicalIndicators.movingAverage50}
     News Headline: "${coin.sentiment.headline}"
     Sentiment Score: ${coin.sentiment.score}/100`
  ).join('\n---\n');

  const prompt = `
    You are an expert crypto technical and fundamental analyst. 
    Analyze the following market data for multiple cryptocurrencies.
    
    Data:
    ${dataSummary}

    For each coin:
    1. Weigh the technical indicators (RSI, MACD, Trend) against the News Sentiment.
    2. Predict the short-term trend (next 24-48 hours).
    3. Provide a confidence score (0-100).
    4. Provide a concise reasoning explaining how the news confirms or contradicts the technicals.
    5. Identify a key price level (support or resistance).
    
    Return the response as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              trend: { type: Type.STRING, enum: [TrendDirection.BULLISH, TrendDirection.BEARISH, TrendDirection.NEUTRAL] },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              keyLevel: { type: Type.STRING },
            },
            required: ["symbol", "trend", "confidence", "reasoning", "keyLevel"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return [];
    
    const parsed = JSON.parse(resultText) as AIPrediction[];
    return parsed;

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    // Fallback or empty array on error
    return [];
  }
};

export const analyzeGemCandidates = async (pairs: DexPair[]): Promise<AIPrediction[]> => {
    const ai = getClient();
    
    // Take top 20 candidates by volume to analyze
    const candidates = pairs.slice(0, 20).map(p => 
      `Symbol: ${p.baseToken.symbol} (${p.chainId})
       Price: $${p.priceUsd}
       Liquidity: $${p.liquidity?.usd}
       FDV: $${p.fdv}
       1h Change: ${p.priceChange.h1}%
       24h Vol: $${p.volume.h24}
       Address: ${p.pairAddress}`
    ).join('\n---\n');
  
    const prompt = `
      You are a "Degen" Crypto Analyst looking for hidden gems with 5x-10x potential in the short term.
      Analyze the following raw DexScreener data.
  
      Criteria for 5x Potential:
      1. High Volume to Liquidity ratio (indicates high demand/volatility).
      2. Strong Momentum (positive 1h change).
      3. Reasonable FDV (Fully Diluted Valuation) - ideally under $10M for max multiplier, but not so low it's a rug pull.
  
      Select the TOP 3 candidates from the list.
      
      Return a JSON array with:
      - symbol: The token symbol
      - trend: BULLISH (always bullish for gems you select)
      - confidence: 0-100 (how likely it is to pump)
      - reasoning: A short, punchy explanation of why this has 5x potential (e.g. "Volume 3x liquidity with breakout momentum").
      - keyLevel: Suggested entry price.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                trend: { type: Type.STRING, enum: [TrendDirection.BULLISH, TrendDirection.BEARISH, TrendDirection.NEUTRAL] },
                confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
                keyLevel: { type: Type.STRING },
              },
              required: ["symbol", "trend", "confidence", "reasoning", "keyLevel"]
            }
          }
        }
      });
  
      const resultText = response.text;
      if (!resultText) return [];
      return JSON.parse(resultText) as AIPrediction[];
  
    } catch (error) {
      console.error("Gemini Gem Analysis Error:", error);
      return [];
    }
  };

export const analyzeDexScreenshot = async (base64Image: string): Promise<string> => {
  const ai = getClient();
  
  // Clean base64 string if it contains metadata header
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: `
                You are a "Degen" Crypto Trader and Technical Analyst.
                Analyze this DexScreener chart screenshot provided.
                
                I am looking for a "Hidden Gem" for a SHORT TERM trade.
                Look for:
                - Breakout patterns (Cup & Handle, Bull Flags)
                - Volume spikes
                - Liquidity / Market Cap ratios if visible
                - Support/Resistance levels

                Output your response in this specific HTML-friendly format (do not use markdown code blocks, just plain text with line breaks):

                <h3 class="text-xl font-bold text-white mb-2">💎 Recommendation: [COIN NAME/TICKER]</h3>
                <p class="mb-2"><strong class="text-cyan-400">Action:</strong> [BUY / WAIT / AVOID]</p>
                <p class="mb-2"><strong class="text-purple-400">Timeframe:</strong> [e.g. 15 mins - 4 hours]</p>
                <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <strong class="block text-gray-400 text-xs uppercase mb-1">Analysis & Reasoning:</strong>
                    [Your detailed reasoning here. Be specific about what you see in the chart.]
                </div>
                <p class="mt-2 text-xs text-gray-500">Risk Level: [Low/Med/High/Degen]</p>

                If the chart is blurry or unreadable, say so. If the chart looks like a rug pull or bearish, warn me explicitly.
            `}
        ]
      }
    });

    return response.text || "Analysis failed to generate text.";

  } catch (error) {
    console.error("Image Analysis Error:", error);
    return "Error processing image. Please try again.";
  }
};

export const chatWithOracle = async (history: {role: string, text: string}[], userMessage: string): Promise<string> => {
    const ai = getClient();

    // Convert history format to Gemini format
    // Simple implementation: Just concatenate the conversation context into a single prompt for stateless request
    // This allows the AI to "remember" the conversation
    
    const context = history.map(h => `${h.role === 'user' ? 'User' : 'Oracle'}: ${h.text}`).join('\n');
    
    const prompt = `
        You are the "Crypto Oracle", a highly intelligent and slightly witty AI crypto assistant.
        You help users understand market trends, technical indicators, and general crypto knowledge.
        
        Current Conversation:
        ${context}
        User: ${userMessage}
        Oracle:
        
        Provide a concise, helpful, and data-driven response. 
        If asked about price, remind them to check the scanner for live data. 
        Keep answers under 80 words if possible.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt
        });
        return response.text || "I'm having trouble connecting to the blockchain ether. Try again.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Connection error. Please check your network.";
    }
};