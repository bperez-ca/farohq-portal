import type { ProviderId } from "@/lib/reviews/types";

interface ProviderLogoProps {
  provider: ProviderId;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "outline";
  className?: string;
}

export function ProviderLogo({ provider, size = "md", variant = "full", className = "" }: ProviderLogoProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const logos: Record<ProviderId, { color: string; svg: string; outlineSvg: string }> = {
    google: {
      color: "#4285F4",
      svg: `<svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 2"/></svg>`,
    },
    yelp: {
      color: "#D32323",
      svg: `<svg viewBox="0 0 24 24" fill="#D32323"><path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-2.328-1.862-2.328-1.862-.454-.354-.535-.808-.407-1.188.12-.357.331-.546.642-.672 0 0 2.379-.969 2.379-.984.188-.06.346-.093.47-.093.36 0 .565.196.672.344.331.454.572 1.355.451 1.698zm-3.744-3.847c-.391-.407-.586-.844-.526-1.188.075-.375.337-.579.672-.726l2.468-.969c.243-.094.45-.135.602-.135.39 0 .631.196.766.421.391.66.572 2.499.421 3.299-.12.633-.556.86-.887.86-.195 0-.406-.075-.632-.195 0 0-1.932-1.05-1.932-1.065-.211-.15-.421-.308-.952-.302zm-6.846 3.242l1.275-3.788c.12-.361.391-.556.721-.616.361-.075.721.06.962.346l2.183 2.573c.211.241.316.496.316.736 0 .526-.421.952-.947.952-.18 0-.375-.045-.586-.135l-3.029-1.343c-.346-.15-.526-.361-.586-.646-.06-.285.015-.556.391-.945.195-.211.406-.421.3-.134zm-3.454-3.242c-.531-.006-.741-.152-.952-.302 0-.015-1.932-1.065-1.932-1.065-.226-.12-.437-.195-.632-.195-.331 0-.766.226-.887.86-.15.8.03 2.638.421 3.299.135.226.376.421.766.421.151 0 .359-.04.602-.135l2.468-.969c.335-.147.597-.351.672-.726.06-.344-.135-.78-.526-1.188zm-.963-3.968c.06-.285-.015-.556-.391-.945-.195-.211-.406-.421-.3-.134l-1.275-3.788c-.12-.361-.391-.556-.721-.616-.361-.075-.721.06-.962.346L1.272 7.847c-.211.241-.316.496-.316.736 0 .526.421.952.947.952.18 0 .375-.045.586-.135l3.029-1.343c.346-.15.526-.361.586-.646z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    },
    apple: {
      color: "#000000",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`,
    },
    bing: {
      color: "#008373",
      svg: `<svg viewBox="0 0 24 24" fill="#008373"><path d="M5 3v18l7.5-4.5 3.5 1.5 3-1.5V3H5zm12 13l-3 1.5-3.5-1.5L7 18V5h10v11z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13l4-2-4-2v4zm-8-8h20v14H2V5z"/></svg>`,
    },
    trustpilot: {
      color: "#00B67A",
      svg: `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="2" fill="#00B67A"/><path d="M12 4l2.472 7.608h8.028l-6.49 4.716 2.472 7.608L12 19.216l-6.482 4.716 2.472-7.608-6.49-4.716h8.028L12 4z" fill="white"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    },
    yotpo: {
      color: "#7C3AED",
      svg: `<svg viewBox="0 0 24 24" fill="#7C3AED"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-10l-4 4h3v4h2v-4h3l-4-4z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8m-4-4h8"/></svg>`,
    },
    judgeme: {
      color: "#EC4899",
      svg: `<svg viewBox="0 0 24 24" fill="#EC4899"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6h6M9 12h6M9 18h6M5 21V3l2 2 2-2 2 2 2-2 2 2 2-2v18l-2-2-2 2-2-2-2 2-2-2-2 2z"/></svg>`,
    },
    stamped: {
      color: "#F59E0B",
      svg: `<svg viewBox="0 0 24 24" fill="#F59E0B"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-10h4v2h-4V8zm0 4h4v2h-4v-2zM6 8h4v8H6V8z"/></svg>`,
      outlineSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h10"/></svg>`,
    },
  };

  const logo = logos[provider];
  const svgContent = variant === "full" ? logo.svg : logo.outlineSvg;

  return (
    <div
      className={`${sizeClasses[size]} ${className} flex-shrink-0`}
      style={variant === "outline" ? { color: logo.color } : undefined}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
