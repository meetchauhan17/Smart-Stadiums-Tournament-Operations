import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <div className="w-full flex flex-col gap-3 mb-6 mt-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <Link to="/" className="hover:text-blue-500 transition-colors flex items-center gap-1">
          <Home size={12} />
          <span>Home</span>
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <div key={to} className="flex items-center gap-1.5">
              <ChevronRight size={11} className="text-gray-300" />
              {isLast ? (
                <span className="text-gray-700 font-semibold">{displayValue}</span>
              ) : (
                <Link to={to} className="hover:text-blue-500 transition-colors">
                  {displayValue}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h1 className="font-bold text-2xl md:text-3xl text-gray-900 tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-gray-200 mt-1" />
    </div>
  );
}
