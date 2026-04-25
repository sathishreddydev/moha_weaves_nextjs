import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - Moha Weaves",
  description:
    "Learn about Moha Weaves and our commitment to preserving India's textile heritage.",
};

export default function AboutUsPage() {
  return (
    <div>
      <header className="mb-8 md:mb-12 border-b border-slate-100 pb-6 md:pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          About Moha Weaves
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
          Celebrating India's textile heritage through handcrafted sarees that
          blend tradition with contemporary style.
        </p>
      </header>
      {/* Our Story Section */}
      <section className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                Our Story
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Founded in 2020, Moha Weaves was born from a passion for
                preserving India's centuries-old textile traditions. We work
                directly with skilled artisans across India to bring authentic
                handcrafted sarees to contemporary fashion enthusiasts.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
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
        </div>
      </section>

      {/* Mission Section */}
      <section className="p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Our Mission
            </h2>
            <p className="text-sm text-gray-700 max-w-2xl mx-auto">
              Preserving traditional craftsmanship while supporting artisan
              communities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Preserve Heritage
              </h3>
              <p className="text-gray-600 text-xs">
                Supporting traditional weaving techniques through fair trade
                practices.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Sustainable Fashion
              </h3>
              <p className="text-gray-600 text-xs">
                Committed to eco-friendly practices and natural materials.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Empower Artisans
              </h3>
              <p className="text-gray-600 text-xs">
                Creating economic opportunities for weaving communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">200+</div>
              <div className="text-gray-600">Artisan Families</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">15+</div>
              <div className="text-gray-600">Weaving Traditions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                10,000+
              </div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">25+</div>
              <div className="text-gray-600">States Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Join Our Journey
          </h2>
          <p className="text-sm text-gray-700 mb-8 max-w-2xl mx-auto">
            Explore our collection of handcrafted sarees and support traditional
            craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="default">
              <Link href="/collections"> Explore Collection</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
