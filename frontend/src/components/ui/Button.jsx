import { Link } from 'react-router';

const VARIANTS = {
  primary: 'bg-teal-500 text-navy-900 font-semibold hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-500',
  secondary: 'border border-gray-200 bg-white text-navy-900 hover:bg-gray-200/60 disabled:text-gray-500',
  danger: 'text-orange-500 font-medium hover:bg-orange-500/10 disabled:text-gray-500',
  ghost: 'text-teal-600 font-medium hover:bg-teal-500/10 disabled:text-gray-500',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-[44px] text-base transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed';

export function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = 'primary', className = '', ...props }) {
  return <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}
