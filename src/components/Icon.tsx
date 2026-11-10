import type { SVGProps } from 'react';

export type IconName = 'arrow' | 'check' | 'alert' | 'link' | 'message' | 'qr' | 'menu' | 'close' | 'search' | 'shield' | 'access';
export function Icon({ name, className = '', ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg {...props} className={`icon ${className}`.trim()} aria-hidden="true" focusable="false"><use href={`#i-${name}`} /></svg>;
}
