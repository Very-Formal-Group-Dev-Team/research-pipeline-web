import Link from 'next/link';
import Button from '@/components/Button';
import { FiArrowRight, FiBook, FiUsers, FiCalendar, FiFileText } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBook className="text-2xl text-primary-500" />
              <h1 className="text-xl font-bold text-primary-500">Student Research Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="error">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-primary-500 mb-6">
            Streamline Your Research Journey
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            A comprehensive platform for managing academic research projects from proposal to publication.
            Collaborate with advisers, track progress, and schedule defenses—all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button variant="error" size="lg" rightIcon={<FiArrowRight />}>
                Start Your Project
              </Button>
            </Link>
            <Link href="/dev/components">
              <Button variant="outline" size="lg">
                View Components
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiBook className="text-2xl text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary-500 mb-2">
              Project Management
            </h3>
            <p className="text-neutral-600">
              Create, track, and manage research projects with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <FiUsers className="text-2xl text-accent-400" />
            </div>
            <h3 className="text-lg font-semibold text-primary-500 mb-2">
              Collaboration
            </h3>
            <p className="text-neutral-600">
              Work together with advisers and team members in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
              <FiFileText className="text-2xl text-success-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary-500 mb-2">
              Document Control
            </h3>
            <p className="text-neutral-600">
              Version control for research documents with GitHub-style tracking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-4">
              <FiCalendar className="text-2xl text-warning-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary-500 mb-2">
              Defense Scheduling
            </h3>
            <p className="text-neutral-600">
              Coordinate defense events and panel evaluations seamlessly.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-primary-500 rounded-2xl p-12 text-center shadow-medium">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-white/80 mb-8 text-lg">
            Join hundreds of students and researchers using our platform
          </p>
          <Link href="/register">
            <Button variant="error" size="lg">
              Create Your Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-600">
            <p>© 2026 Student Research Portal. Built for Mapúa Malayan Colleges Mindanao.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

