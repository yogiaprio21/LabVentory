import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

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
            <Icon name="home" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
