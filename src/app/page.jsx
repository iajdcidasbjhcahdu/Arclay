import HomeHero from "./components/HomeHero";
import TrustBadges from "./components/TrustBadges";
import CategoryGrid from "./components/CategoryGrid";
import ProductRail from "./components/ProductRail";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";
import MobileProductSections from "./components/MobileProductSections";
import HomeBlog from "./components/HomeBlog";
import { Flame, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FEFBF6] text-[#2A2F25]">
      <main>
        {/* Full Width Hero Slider */}
        <HomeHero />

        {/* Mobile: Category pills + Product grids */}
        <MobileProductSections />


        {/* Explore Categories */}
        <CategoryGrid />

        {/* Best Sellers */}
        <ProductRail
          title="Best Sellers"
          subtitle="Most Popular"
          icon={<Flame className="w-5 h-5 text-[#D86B4B]" />}
          endpoint="/api/products?isFeatured=true&limit=8"
          viewAllLink="/products?filter=bestseller"
          bgWhite={true}
        />

        {/* Our Story */}
        <OurStory />

        {/* New Arrivals */}
        <ProductRail
          title="New Arrivals"
          subtitle="Just Launched"
          icon={<Sparkles className="w-5 h-5 text-[#869661]" />}
          endpoint="/api/products?sort=newest&limit=8"
          viewAllLink="/products?filter=new"
          bgWhite={false}
        />

        {/* Blog Section (Image 1 Style) */}
        <HomeBlog />

        {/* Social Proof / Reviews */}
        <SocialProof />
      </main>
    </div>
  );
}
