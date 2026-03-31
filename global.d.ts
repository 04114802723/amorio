declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export type Icon = FC<IconProps>;
  
  export const SkipForward: Icon;
  export const UserPlus: Icon;
  export const Mic: Icon;
  export const MicOff: Icon;
  export const Video: Icon;
  export const VideoOff: Icon;
  export const Sparkles: Icon;
  export const X: Icon;
  export const Heart: Icon;
  export const ThumbsUp: Icon;
  export const Flame: Icon;
  export const PartyPopper: Icon;
  export const Loader2: Icon;
  export const CheckCircle: Icon;
  export const MessageCircle: Icon;
  export const Users: Icon;
  export const Phone: Icon;
  export const ArrowRight: Icon;
  export const Send: Icon;
  export const ChevronLeft: Icon;
  export const Search: Icon;
  export const Menu: Icon;
  export const LogOut: Icon;
  export const Settings: Icon;
  export const Shield: Icon;
  export const Zap: Icon;
  export const Star: Icon;
  export const Globe: Icon;
  export const Lock: Icon;
  export const Mail: Icon;
  export const Github: Icon;
  export const Twitter: Icon;
  export const Instagram: Icon;
}
