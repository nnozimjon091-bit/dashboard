// Yengil inline ikonkalar — tashqi kutubxonasiz.

type IconProps = { className?: string };

const DEFAULT_SIZE = "h-[18px] w-[18px]";

function Svg({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // shrink-0 doim qoladi — aks holda flex konteyner ikonkani siqib qo'yadi.
      className={`shrink-0 ${className ?? DEFAULT_SIZE}`}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconSocial = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconAds = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 10v4a1 1 0 0 0 1 1h3l5 4V5L7 9H4a1 1 0 0 0-1 1Z" />
    <path d="M17 9a4 4 0 0 1 0 6" />
    <path d="M19.5 6.5a8 8 0 0 1 0 11" />
  </Svg>
);

export const IconVideo = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="3.5" />
    <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" />
  </Svg>
);

export const IconSales = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 15l3.5-4.5 3 3L20 7" />
  </Svg>
);

export const IconEntry = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const IconSettings = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Svg>
);

export const IconSun = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" />
  </Svg>
);

export const IconMoon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Svg>
);

export const IconTrash = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </Svg>
);

export const IconArrowUp = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 19V6" />
    <path d="m6 11 6-6 6 6" />
  </Svg>
);

export const IconArrowDown = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v13" />
    <path d="m6 13 6 6 6-6" />
  </Svg>
);

export const IconTable = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M3 9.5h18M9 9.5v10" />
  </Svg>
);

export const IconChart = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 20v-6M12.5 20v-9M17 20v-4" />
  </Svg>
);
