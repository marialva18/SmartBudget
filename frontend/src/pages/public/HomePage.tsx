import { HomeCoachSection } from './components/HomeCoachSection';
import { HomeDemoSection } from './components/HomeDemoSection';
import { HomeFeatures } from './components/HomeFeatures';
import { HomeFooter } from './components/HomeFooter';
import { HomeHeader } from './components/HomeHeader';
import { HomeHero } from './components/HomeHero';
import { HomeSecuritySection } from './components/HomeSecuritySection';

export function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef6f1] text-slate-900">
      <HomeHeader />
      <HomeHero />
      <HomeDemoSection />
      <HomeFeatures />
      <HomeCoachSection />
      <HomeSecuritySection />
      <HomeFooter />
    </main>
  );
}
