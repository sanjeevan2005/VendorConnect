import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Icon = ({ children, size = 16, ...rest }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

export const Icons = {
  Rfq: (p: IconProps) => <Icon {...p}><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h5"/></Icon>,
  Plus: (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Phone: (p: IconProps) => <Icon {...p}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.4 2L8 9.6a16 16 0 006 6l1.3-1.3a2 2 0 012-.4c.8.3 1.7.6 2.6.7a2 2 0 011.7 2z"/></Icon>,
  Mail: (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  Chev: (p: IconProps) => <Icon {...p}><path d="M9 18l6-6-6-6"/></Icon>,
  ChevDown: (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  Sparkle: (p: IconProps) => <Icon {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7L19 20l-.7-1.7L16.5 18l1.8-.5z"/></Icon>,
  Check: (p: IconProps) => <Icon {...p}><path d="M5 12l5 5L20 6"/></Icon>,
  X: (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  Download: (p: IconProps) => <Icon {...p}><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></Icon>,
  Refresh: (p: IconProps) => <Icon {...p}><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></Icon>,
  Link: (p: IconProps) => <Icon {...p}><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></Icon>,
  Paperclip: (p: IconProps) => <Icon {...p}><path d="M21 12l-8.5 8.5a5 5 0 01-7-7L13 5a3.5 3.5 0 015 5l-8 8a2 2 0 01-3-3l7-7"/></Icon>,
  Mic: (p: IconProps) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3"/></Icon>,
  Quotes: (p: IconProps) => <Icon {...p}><path d="M4 5h16v4H4zM4 11h16v4H4zM4 17h16v2H4z"/></Icon>,
  Vendors: (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/><circle cx="17" cy="6" r="2.5"/><path d="M14.5 14c2.5 0 5.5 1.5 5.5 4"/></Icon>,
};

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" stroke="#0B3B3C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" stroke="#12A8A6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" stroke="#0B3B3C" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    </svg>
  );
}
