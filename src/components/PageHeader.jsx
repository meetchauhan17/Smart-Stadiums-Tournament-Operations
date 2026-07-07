import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  const location = useLocation();

  // Simple breadcrumb generator based on pathname
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <div className="w-full flex flex-col gap-3 mb-6 mt-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#4A6580] font-medium">
        <Link to="/" className="hover:text-[#00D4FF] transition-colors flex items-center gap-1">
          <Home size={12} />
          <span>Home</span>
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <div key={to} className="flex items-center gap-1.5">
              <ChevronRight size={11} className="text-[#0F2340]" />
              {isLast ? (
                <span className="text-[#E8F4FD] font-semibold">{displayValue}</span>
              ) : (
                <Link to={to} className="hover:text-[#00D4FF] transition-colors">
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
            <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/8 border border-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] shrink-0 shadow-[0_0_15px_rgba(0,212,255,0.06)]">
              <Icon size={24} />
            </div>
          )}
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#4A6580] mt-1.5 leading-relaxed font-medium">
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

      {/* Decorative neon bottom bar */}
      <div className="w-full h-px bg-gradient-to-r from-[#00D4FF]/25 via-[#00D4FF]/5 to-transparent mt-1" />
    </div>
  );
}
