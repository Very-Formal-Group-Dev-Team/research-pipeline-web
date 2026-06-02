import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import { FiArrowRight, FiBook, FiUsers, FiCalendar, FiFileText } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="coordinator-theme min-h-screen bg-coordinator-cream text-coordinator-ink">
      {/* Navigation — matches dashboard header cream bar */}
      <nav className="border-b border-[#E5DFDF] bg-coordinator-cream sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/archivum.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" priority />
              <h1 className="text-xl font-bold text-coordinator-navy">Archivum</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-coordinator-navy hover:bg-coordinator-navy/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="coordinator-btn-primary bg-velvetWine text-snow hover:bg-velvetWine/90 border-0 shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-coordinator-navy mb-6">
            Streamline Your Research Journey
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            A comprehensive platform for managing academic research projects from proposal to publication.
            Collaborate with advisers, track progress, and schedule defenses. All in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                rightIcon={<FiArrowRight />}
                className="coordinator-btn-primary bg-velvetWine text-snow hover:bg-velvetWine/90 border-0"
              >
                Start Your Project
              </Button>
            </Link>
            <Link href="/dev/components">
              <Button
                variant="outline"
                size="lg"
                className="coordinator-btn-secondary border-coordinator-navy text-coordinator-navy hover:bg-coordinator-navy/5"
              >
                View Components
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl border border-[#E5DFDF] shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-coordinator-navy/10 rounded-lg flex items-center justify-center mb-4">
              <FiBook className="text-2xl text-coordinator-navy" />
            </div>
            <h3 className="text-lg font-semibold text-coordinator-navy mb-2">
              Project Management
            </h3>
            <p className="text-neutral-600">
              Create, track, and manage research projects with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E5DFDF] shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-coordinator-rose/15 rounded-lg flex items-center justify-center mb-4">
              <FiUsers className="text-2xl text-coordinator-rose" />
            </div>
            <h3 className="text-lg font-semibold text-coordinator-navy mb-2">
              Collaboration
            </h3>
            <p className="text-neutral-600">
              Work together with advisers and team members in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E5DFDF] shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-coordinator-navy/10 rounded-lg flex items-center justify-center mb-4">
              <FiFileText className="text-2xl text-coordinator-navy" />
            </div>
            <h3 className="text-lg font-semibold text-coordinator-navy mb-2">
              Document Control
            </h3>
            <p className="text-neutral-600">
              Version control for research documents with GitHub-style tracking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E5DFDF] shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-coordinator-rose/15 rounded-lg flex items-center justify-center mb-4">
              <FiCalendar className="text-2xl text-coordinator-rose" />
            </div>
            <h3 className="text-lg font-semibold text-coordinator-navy mb-2">
              Defense Scheduling
            </h3>
            <p className="text-neutral-600">
              Coordinate defense events and panel evaluations seamlessly.
            </p>
          </div>
        </div>

        {/* CTA Section — navy band like sidebar */}
        <div className="mt-20 bg-coordinator-navy rounded-2xl p-12 text-center shadow-medium">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-white/80 mb-8 text-lg">
            Join hundreds of students and researchers using our platform
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="coordinator-btn-primary bg-velvetWine text-snow hover:bg-velvetWine/90 border-0"
            >
              Create Your Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer — matches dashboard footer */}
      <footer className="border-t border-[#E5DFDF] bg-coordinator-cream mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-600">
            <p>© {new Date().getFullYear()} Archivum. Built for Mapúa Malayan Colleges Mindanao.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
