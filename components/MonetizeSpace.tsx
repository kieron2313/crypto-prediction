import React, { useEffect, useState, useRef } from 'react';
import { AdSpaceConfig } from '../types';
import { systemService } from '../services/userService';

interface MonetizeSpaceProps {
  slotId?: string; // e.g. 'scanner_feed', 'signals_top'
}

// Default fallback ads if nothing is configured
const DEFAULT_AD_CONFIG: AdSpaceConfig = {
  id: 'default',
  name: 'Default Space',
  type: 'DEFAULT',
  active: true,
  impressions: 0
};

export const MonetizeSpace: React.FC<MonetizeSpaceProps> = ({ slotId = 'default_slot' }) => {
  const [config, setConfig] = useState<AdSpaceConfig>(DEFAULT_AD_CONFIG);
  const [allAds, setAllAds] = useState<AdSpaceConfig[]>([]);
  const loggedRef = useRef(false);

  // Effect 1: Load Config & Listen for Updates from Firestore
  useEffect(() => {
    const unsubscribe = systemService.subscribeToAds((ads) => {
        setAllAds(ads);
        const match = ads.find(ad => ad.id === slotId);
        if (match && match.active) {
            setConfig(match);
        } else {
            setConfig(DEFAULT_AD_CONFIG);
        }
    });
    
    return () => unsubscribe();
  }, [slotId]);

  // Effect 2: Increment Impression Counter in Firestore
  useEffect(() => {
    // Prevent double logging in StrictMode or re-renders
    if (loggedRef.current) return;
    if (config.type === 'DEFAULT' && config.id === 'default') return; // Don't log default placeholder

    // Use a timeout to ensure it counts as a valid "view"
    const impressionTimer = setTimeout(() => {
        if (allAds.length > 0) {
           // We pass allAds to the service so it can perform the array update
           systemService.recordImpression(slotId, allAds).catch(err => console.error("Impression Log Error", err));
           loggedRef.current = true;
        }
    }, 2000); 

    return () => clearTimeout(impressionTimer);
  }, [slotId, config.id, allAds.length]); // Dependency on allAds.length ensures we have data before logging

  if (config.type === 'CODE' && config.customCode) {
      return (
          <div className="w-full my-8 flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: config.customCode }} />
          </div>
      );
  }

  if (config.type === 'BANNER' && config.bannerUrl) {
      return (
        <div className="w-full my-8">
            <a href={config.linkUrl || '#'} target="_blank" rel="noreferrer" className="block relative w-full h-24 sm:h-32 bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden group cursor-pointer hover:border-cyan-500/30 transition-all duration-500">
                <img src={config.bannerUrl} alt="Advertisement" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 bg-black/50 text-[10px] text-gray-400 px-1 rounded">Ad</div>
            </a>
        </div>
      );
  }

  // Default rendering
  return (
    <div className="w-full my-8">
      <div className="relative w-full h-24 bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden group cursor-pointer hover:border-cyan-500/30 transition-all duration-500">
         {/* Animated Background Shimmer */}
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
         
         <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest border border-gray-700 px-1.5 py-0.5 rounded bg-black/50">Ad</span>
                <span className="text-xs text-cyan-400 font-bold tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    SPONSORED
                </span>
            </div>
            <p className="text-gray-300 font-medium text-sm sm:text-base">
                Get <span className="text-white font-bold">Premium Signals</span> & Zero-Fee Trading on CryptoMind Pro.
            </p>
         </div>
         
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 p-12 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 p-8 bg-blue-600/10 blur-[40px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};
