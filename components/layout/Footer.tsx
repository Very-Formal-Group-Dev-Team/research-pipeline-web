export type FooterVariant = 'app' | 'public';

export interface FooterProps {
  /** `app` — dashboard chrome; `public` — marketing / landing pages */
  variant?: FooterVariant;
  className?: string;
}

const footerLinks = [
  { href: '#', label: 'Privacy Policy' },
  { href: '#', label: 'Terms of Service' },
  { href: '#', label: 'Help Center' },
] as const;

function FooterLinks({ className = '' }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm ${className}`.trim()}
      aria-label="Footer"
    >
      {footerLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="text-neutral-600 hover:text-primary-500 transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export default function Footer({ variant = 'app', className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const shellClass =
    variant === 'public'
      ? 'bg-snow border-t border-[#E5DFDF] mt-auto'
      : 'bg-coordinator-cream border-t border-[#E5DFDF] mt-auto';

  if (variant === 'public') {
    return (
      <footer className={`${shellClass} ${className}`.trim()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:items-center">
            <div className="text-center md:text-left text-sm text-neutral-600">
              <p>© {currentYear} Archivum. All rights reserved.</p>
              <p className="text-xs text-neutral-500 mt-1">
                Built for Mapúa Malayan Colleges Mindanao.
              </p>
            </div>
            <FooterLinks />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`${shellClass} ${className}`.trim()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-neutral-600">
            © {currentYear} Archivum. All rights reserved.
          </div>
          <FooterLinks className="md:justify-end" />
        </div>
      </div>
    </footer>
  );
}
