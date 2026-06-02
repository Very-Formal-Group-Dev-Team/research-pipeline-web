import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import { FiArrowRight } from 'react-icons/fi';

const stats = [
  { value: '100+', label: 'Research projects supported across programs' },
  { value: '3', label: 'Dedicated roles for students, advisers, and coordinators' },
  { value: '1', label: 'Shared calendar for defenses, meetings, and events' },
] as const;

const features = [
  {
    num: '01',
    title: 'Project management',
    description:
      'Create, track, and manage research projects from proposal through completion.',
  },
  {
    num: '02',
    title: 'Collaboration',
    description:
      'Invite contributors and advisers with project codes and role-based access.',
  },
  {
    num: '03',
    title: 'Document control',
    description:
      'Upload papers and follow a version timeline for every submission.',
  },
  {
    num: '04',
    title: 'Defense scheduling',
    description:
      'Book meetings, schedule defenses, and view institution events in one place.',
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-coordinator-cream">
      <nav className="bg-coordinator-cream sticky top-0 z-50 border-b border-solid border-neutral-400 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/archivum.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0"
                priority
              />
              <span className="font-serif text-xl font-semibold text-primary-700 truncate">
                Archivum
              </span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <a
                href="#features"
                className="text-sm text-neutral-600 hover:text-primary-700 transition-colors"
              >
                About
              </a>
              <Link href="/login">
                <Button variant="ghost" className="rounded-sm text-primary-700">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="sm" className="rounded-sm">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold text-primary-700 leading-[1.15]">
                Your research,{' '}
                <span className="block italic text-archivumRed font-serif mt-1">
                  from proposal to publication.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed">
                Archivum is a comprehensive platform for managing academic research projects.
                Collaborate with advisers, track progress, and schedule defenses—all in one
                place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="rounded-sm w-full sm:w-auto">
                    Start your project
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="ghost" size="lg" className="rounded-sm w-full sm:w-auto text-primary-700">
                    View demo
                  </Button>
                </a>
              </div>
            </div>

            <div className="border-t border-neutral-300 lg:border-t-0 lg:border-l lg:pl-12 lg:pt-2">
              <ul className="divide-y divide-neutral-300">
                {stats.map((stat) => (
                  <li key={stat.value} className="py-6 first:pt-0 last:pb-0">
                    <p className="font-serif text-4xl sm:text-5xl font-semibold text-primary-700 tabular-nums">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xs leading-relaxed">
                      {stat.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 scroll-mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature) => (
              <Card key={feature.num} className="!rounded-sm h-full" hoverShadow>
                <p className="text-sm font-medium text-archivumRed tabular-nums mb-4">
                  {feature.num}
                </p>
                <h2 className="font-serif text-xl font-semibold text-eerieBlack mb-3">
                  {feature.title}
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-oxfordBlue border-t border-solid border-neutral-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-snow leading-snug max-w-2xl">
                Ready to begin?{' '}
                <span className="italic text-archivumRed font-serif">
                  Your research deserves structure.
                </span>
              </h2>
              <Link href="/register" className="shrink-0">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-sm border-snow text-snow hover:bg-white/10 hover:text-snow hover:border-snow w-full md:w-auto"
                  rightIcon={<FiArrowRight aria-hidden />}
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="public" className="!bg-coordinator-cream" />
    </div>
  );
}
