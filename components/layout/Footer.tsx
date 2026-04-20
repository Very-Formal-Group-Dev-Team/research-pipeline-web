export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-neutral-600">
            © {currentYear} Student Research Portal. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
