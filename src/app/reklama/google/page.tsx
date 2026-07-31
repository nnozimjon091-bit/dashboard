"use client";

import { AdsView } from "@/components/ads-view";
import { GoogleAdsImport } from "@/components/google-ads-import";

export default function GoogleAdsPage() {
  return (
    <AdsView
      platform="google"
      title="Google Ads"
      description="Qidiruv va displey kampaniyalari: byudjet, trafik va lid narxi."
      toolbar={<GoogleAdsImport />}
    />
  );
}
