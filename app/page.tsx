import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import { FiArrowRight } from 'react-icons/fi';

type PublicLandingStats = {
  totalProjects: number;
  totalUsers: number;
  finishedProjects: number;
};

function formatCount(value: number) {    
  return new Intl.NumberFormat('en-US').format(value);
}

function parseStat(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

async function getAppOrigin(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

async function fetchPublicStats(): Promise<PublicLandingStats | null> {
  try {
    const origin = await getAppOrigin();
    const res = await fetch(`${origin}/api/public/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const totalProjects = parseStat(json.totalProjects);
    const totalUsers = parseStat(json.totalUsers);
    const finishedProjects = parseStat(json.finishedProjects);
    if (totalProjects == null || totalUsers == null || finishedProjects == null) {
      return null;
    }
    return { totalProjects, totalUsers, finishedProjects };
  } catch {
    return null;
  }
}

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

export default async function Home() {
  const stats = (await fetchPublicStats()) ?? {
    totalProjects: 0,
    totalUsers: 0,
    finishedProjects: 0,
  };

  return (
    <div className="min-h-screen flex flex-col bg-coordinator-cream">
      <nav className="bg-ivory sticky top-0 z-50 border-b border-solid border-neutral-400 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/archivum.svg"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                priority
              />
              <span className="font-serif text-xl sm:text-2xl font-semibold text-primary-700 truncate leading-tight">
                Archivum
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a
                href="#features"
                className="inline-flex items-center px-3 py-2 text-base font-medium text-primary-700 hover:text-oxfordBlue transition-colors rounded-sm"
              >
                About
              </a>
              <Link href="/login">
                <Button variant="ghost" size="md" className="rounded-sm text-primary-700">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-sm hover:bg-oxfordBlue/90"
                >
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
                Collaborate with advisers, track progress, and schedule defenses in one place.
              </p>
              <div className="mt-8 flex flex-row flex-nowrap gap-3">
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="lg"
                    className="rounded-sm flex-1 sm:flex-none whitespace-nowrap hover:bg-oxfordBlue/90 !px-5 !py-2.5 !text-base sm:!px-7 sm:!py-3 sm:!text-lg"
                  >
                    Start your project
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-sm flex-1 sm:flex-none whitespace-nowrap !border-primary-700/50 !px-5 !py-2 !text-base hover:!border-oxfordBlue hover:!bg-oxfordBlue/10 hover:!text-primary-700 hover:!shadow-[0_2px_10px_rgba(44,62,107,0.12)] sm:!px-7 sm:!py-2.5 sm:!text-lg"
                  >
                    View demo
                  </Button>
                </a>
              </div>
            </div>

            <div className="border-y border-neutral-300 pt-8 pb-8 lg:border-t-0 lg:border-b-0 lg:border-l lg:border-neutral-300 lg:pl-12 lg:pb-0 lg:pt-2">
              <ul className="grid grid-cols-3 divide-x divide-neutral-300 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
                {[
                  { value: formatCount(stats.totalProjects), label: 'Research projects on Archivum' },
                  { value: formatCount(stats.totalUsers), label: 'Students, advisers, and coordinators' },
                  {
                    value: formatCount(stats.finishedProjects),
                    label: 'Research projects marked complete',
                  },
                ].map((stat) => (
                  <li
                    key={stat.label}
                    className="px-2 sm:px-4 first:pl-0 last:pr-0 lg:px-0 lg:py-6 lg:first:pt-0 lg:last:pb-0 min-w-0"
                  >
                    <p className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-primary-700 tabular-nums text-center lg:text-left">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 sm:mt-2 text-[0.65rem] sm:text-xs lg:text-sm xl:text-base text-neutral-600 leading-snug sm:leading-relaxed text-center lg:text-left lg:max-w-xs">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {features.map((feature) => (
              <Card key={feature.num} className="!rounded-sm h-full" hoverShadow>
                <p className="text-sm font-medium text-archivumRed tabular-nums mb-4">
                  {feature.num}
                </p>
                <h2 className="font-serif text-xl font-semibold text-eerieBlack mb-3">
                  {feature.title}
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed text-pretty">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-oxfordBlue border-t border-solid border-neutral-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-snow leading-snug flex-1 min-w-0">
                <span className="block">Ready to begin?</span>
                <span className="mt-2 block italic text-archivumRed font-serif text-pretty md:max-w-xl lg:max-w-2xl">
                  Your&nbsp;research&nbsp;deserves&nbsp;structure.
                </span>
              </h2>
              <Link href="/register" className="shrink-0">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-sm bg-snow text-oxfordBlue border-snow hover:bg-neutral-100 hover:text-oxfordBlue hover:border-neutral-100 w-full md:w-auto"
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
