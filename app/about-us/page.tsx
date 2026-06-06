import { Button } from "@/components/ui/button";
import { BookOpen, Globe, Users } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - Urumi",
  description:
    "Learn about Urumi and our commitment to preserving India's textile heritage.",
};

export default function AboutUsPage() {
  return (
    <div>
      <main className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="border-b border-slate-100 pb-8">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            About Urumi
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
            Celebrating India&apos;s textile heritage through handcrafted sarees that
            blend tradition with contemporary style.
          </p>
        </header>

        {/* Our Story Section */}
        <section>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">
                Our Story
              </h2>
              <p className="text-xs text-gray-700 leading-relaxed mb-4">
                Founded in 2020, Urumi was born from a passion for
                preserving India&apos;s centuries-old textile traditions. We work
                directly with skilled artisans across India to bring authentic
                handcrafted sarees to contemporary fashion enthusiasts.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Our name represents the love and devotion that goes into every
                thread, symbolizing our commitment to honoring heritage while
                embracing modern sensibilities.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src="/placeholder-about-1.jpg"
                  alt="Artisan weaving traditional saree"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">
              Our Mission
            </h2>
            <p className="text-xs text-gray-700 max-w-2xl mx-auto">
              Preserving traditional craftsmanship while supporting artisan
              communities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">
                Preserve Heritage
              </h3>
              <p className="text-gray-600 text-xs">
                Supporting traditional weaving techniques through fair trade
                practices.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">
                Sustainable Fashion
              </h3>
              <p className="text-gray-600 text-xs">
                Committed to eco-friendly practices and natural materials.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">
                Empower Artisans
              </h3>
              <p className="text-gray-600 text-xs">
                Creating economic opportunities for weaving communities.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-slate-100 pb-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">200+</div>
              <div className="text-xs text-gray-600">Artisan Families</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">15+</div>
              <div className="text-xs text-gray-600">Weaving Traditions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                10,000+
              </div>
              <div className="text-xs text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">25+</div>
              <div className="text-xs text-gray-600">States Served</div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">
            Join Our Journey
          </h2>
          <p className="text-xs text-gray-700 mb-8 max-w-2xl mx-auto">
            Explore our collection of handcrafted sarees and support traditional
            craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="h-10" variant="default">
              <Link href="/collections"> Explore Collection</Link>
            </Button>
            <Button className="h-10" variant="outline">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
