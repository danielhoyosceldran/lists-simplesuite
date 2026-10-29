import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}
    >
      {children}
    </svg>
  );
}

export const BackIcon = (p: IconProps) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
export const ChevronIcon = (p: IconProps) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const MoreIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></Icon>
);
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" />
  </Icon>
);
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
);
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>
);
export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="m5 12 5 5 9-10" /></Icon>;
export const DownloadIcon = (p: IconProps) => <Icon {...p}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></Icon>;
export const UploadIcon = (p: IconProps) => <Icon {...p}><path d="M12 15V4m0 0L8 8m4-4 4 4M5 20h14" /></Icon>;
