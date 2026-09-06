"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ETHICAL_ADS_PUBLISHER = process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER_ID;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

// EthicalAds has no fill-or-not callback we can await, so we give its script
// a moment to populate our placeholder div, then fall back to AdSense if it
// didn't (no inventory for this placement/geo, script blocked, etc).
const ETHICAL_ADS_FALLBACK_DELAY_MS = 2000;

let ethicalAdsScriptPromise: Promise<void> | null = null;
function loadEthicalAdsScript(): Promise<void> {
  ethicalAdsScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://media.ethicalads.io/media/client/ethicalads.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load EthicalAds"));
    document.head.appendChild(script);
  });
  return ethicalAdsScriptPromise;
}

/**
 * Non-invasive ad slot: tries EthicalAds first (small text ads, no
 * aggressive tracking), and falls back to AdSense only if EthicalAds has no
 * inventory for this spot. Renders nothing if neither network is configured
 * (both are opt-in via env vars, so local dev shows no ads).
 *
 * The AdSense loader script itself lives in the root layout (it has to be
 * present on every page for Google's site-verification check), so this
 * component only needs to push the ad unit once that script exists.
 */
export default function AdSlot() {
  const ethicalRef = useRef<HTMLDivElement>(null);
  const [showAdsense, setShowAdsense] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!ETHICAL_ADS_PUBLISHER) {
        setShowAdsense(true);
        return;
      }
      try {
        await loadEthicalAdsScript();
      } catch {
        // fall through to the fallback check below regardless
      }
      await new Promise((r) => setTimeout(r, ETHICAL_ADS_FALLBACK_DELAY_MS));
      if (cancelled) return;
      const filled = !!ethicalRef.current && ethicalRef.current.childElementCount > 0;
      if (!filled) setShowAdsense(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showAdsense || !ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    try {
      // The loader script queues this even if it hasn't finished
      // downloading/executing yet (that's the point of the array pattern).
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // AdSense throws if the slot is already initialized (e.g. React
      // strict-mode double-invoke in dev) — safe to ignore.
    }
  }, [showAdsense]);

  if (!ETHICAL_ADS_PUBLISHER && !ADSENSE_CLIENT) return null;

  return (
    <div className="my-6 flex justify-center">
      {ETHICAL_ADS_PUBLISHER && !showAdsense && (
        <div
          ref={ethicalRef}
          data-ea-publisher={ETHICAL_ADS_PUBLISHER}
          data-ea-type="text"
          className="horizontal"
        />
      )}
      {showAdsense && ADSENSE_CLIENT && ADSENSE_SLOT && (
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
