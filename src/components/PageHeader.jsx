import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  const location = useLocation();

  // Simple breadcrumb generator based on pathname
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <div className="w-full flex flex-col gap-3 mb-6 mt-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B7280] font-semibold">
        <Link to="/" className="hover:text-[#3B82F6] transition-colors flex items-center gap-1">
          <Home size={12} />
          <span>Home</span>
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <div key={to} className="flex items-center gap-1.5">
              <ChevronRight size={11} className="text-[#6B7280]" />
              {isLast ? (
                <span className="text-[#111827] font-bold">{displayValue}</span>
              ) : (
                <Link to={to} className="hover:text-[#3B82F6] transition-colors">
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
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border-2 border-[#3B82F6] flex items-center justify-center text-[#3B82F6] shrink-0 shadow-none">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action controls (buttons, filters) */}
        {actions && (
          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Flat bottom line divider */}
      <div className="w-full h-0.5 bg-[#E5E7EB] mt-1" />
    </div>
  );
}
