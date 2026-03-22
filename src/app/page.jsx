import HomeHero from "./components/HomeHero";
import TrustBadges from "./components/TrustBadges";
import CategoryGrid from "./components/CategoryGrid";
import ProductRail from "./components/ProductRail";
import PromoBanner from "./components/PromoBanner";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";
import MobileProductSections from "./components/MobileProductSections";
import { Flame, Sparkles, Leaf } from "lucide-react";
import { getSiteName, getBrandContent } from "@/config/brandContent";

export default function Home() {
  const siteName = getSiteName();
  const content = getBrandContent(siteName);
  const isSanatva = siteName.toLowerCase().includes('sanatva');

  const rail1Title = isSanatva ? "Best Detoxifiers" : "Best Sellers";
  const rail2Title = isSanatva ? "Featured Wellness" : "New Arrivals";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {/* Full Width Hero Slider */}
        <HomeHero />

        {/* Mobile: Category pills + Product grids (replaces desktop sections) */}
        <MobileProductSections />

        {/* Global Trust Badges (desktop) */}
        <TrustBadges />

        {/* Categories Grid (desktop) */}
        <CategoryGrid />

        {/* Best Sellers Rail (desktop) */}
        <ProductRail
          title={rail1Title}
          icon={isSanatva ? <Leaf className="w-6 h-6 text-green-500" /> : <Flame className="w-6 h-6 text-terracotta-500" />}
          endpoint="/api/products?isFeatured=true&limit=8"
          viewAllLink="/shop?filter=bestseller"
          bgWhite={true}
        />

        {/* Festive Promo Banner */}
        <PromoBanner />

        {/* New Arrivals Rail (desktop) */}
        <ProductRail
          title={rail2Title}
          icon={isSanatva ? <Leaf className="w-6 h-6 text-teal-500" /> : <Sparkles className="w-6 h-6 text-olive-500" />}
          endpoint="/api/products?sort=newest&limit=8"
          viewAllLink="/shop?filter=new"
          bgWhite={false}
        />

        {/* Brand Story Section (desktop only) */}
        <OurStory />

        {/* Social Proof / Reviews (desktop only) */}
        <SocialProof />
      </main>
    </div>
  );
}

