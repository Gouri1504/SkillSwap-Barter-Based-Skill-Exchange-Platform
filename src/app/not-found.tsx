import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen t-bg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold t-text mb-2">Page Not Found</h2>
        <p className="t-text-secondary mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium hover:from-primary-500 hover:to-primary-400 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
