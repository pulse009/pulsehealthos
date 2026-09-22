export interface AnnouncementContent {
  isEnabled: boolean;
  badge: string;
  textDesktop: string;
  textMobile: string;
  linkText: string;
  linkHref: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface HeroContent {
  badgeText: string;
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  stats: StatItem[];
}

export interface ArchitectureItem {
  title: string;
  desc: string;
  tag: string;
}

export interface ArchitectureContent {
  badge: string;
  title: string;
  subtitle: string;
  items: ArchitectureItem[];
}

export interface ProductFeatureItem {
  title: string;
  desc: string;
}

export interface ProductCard {
  id: 'healthos' | 'now' | 'speak';
  badge: string;
  name: string;
  subtitle: string;
  description: string;
  monthlyPrice: string;
  ctaText: string;
  ctaHref: string;
  features: ProductFeatureItem[];
}

export interface ProductsContent {
  badge: string;
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  products: ProductCard[];
}

export interface FeatureCategoryItem {
  title: string;
  desc: string;
}

export interface FeatureCategory {
  id: string;
  categoryName: string;
  tag: string;
  description: string;
  items: FeatureCategoryItem[];
}

export interface FeaturesContent {
  badge: string;
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  categories: FeatureCategory[];
}

export interface PricingPlan {
  id: string;
  name: string;
  subtitle: string;
  monthlyPrice: string;
  annualPrice: string;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

export interface PricingContent {
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  discountBadge: string;
  plans: PricingPlan[];
}

export interface LeadershipMember {
  name: string;
  role: string;
  desc: string;
}

export interface AboutContent {
  badge: string;
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  stats: StatItem[];
  missionTitle: string;
  missionText: string;
  leadership: LeadershipMember[];
}

export interface RegionalOffice {
  city: string;
  country: string;
  address: string;
}

export interface ContactContent {
  badge: string;
  headlineFirst: string;
  headlineSecond: string;
  subtitle: string;
  phone: string;
  whatsappUrl: string;
  supportAvailability: string;
  workingHoursDays: string;
  workingHoursTime: string;
  workingHoursTz: string;
  offices: RegionalOffice[];
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterContent {
  tagline: string;
  copyright: string;
  statusText: string;
  productLinks: FooterLink[];
  companyLinks: FooterLink[];
  trustBadges: string[];
}

export interface AllSiteContent {
  announcement: AnnouncementContent;
  hero: HeroContent;
  architecture: ArchitectureContent;
  products: ProductsContent;
  features: FeaturesContent;
  pricing: PricingContent;
  about: AboutContent;
  contact: ContactContent;
  footer: FooterContent;
}

export type SiteContentKey = keyof AllSiteContent;
