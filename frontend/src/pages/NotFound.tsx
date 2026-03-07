import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center space-y-4">
        <div className="text-9xl font-black text-indigo-50/50 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10 select-none">
          404
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Resource Not Found</h1>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">The page you are looking for doesn't exist or has been moved to another quadrant.</p>
        </div>
        <div className="pt-6">
          <Link to="/" className="btn px-8 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
