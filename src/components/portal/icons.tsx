import {
  Activity, Armchair, Award, Bell, Briefcase, Building2, Calendar, ChartLine, Check, ChevronDown, ChevronLeft, ChevronRight,
  CheckCheck, ChevronsRight, CircleHelp, Clock, Code, Contact, Copy, DollarSign, Download, Ellipsis, EllipsisVertical, ExternalLink, Eye, FileUser, Funnel,
  Globe, Handshake, IdCard, Image, Inbox, Kanban, KeyRound, Landmark, Layers, LayoutDashboard, ListFilter, Lock, LogOut, Mail,
  MapPin, Maximize2, Megaphone, Menu, Moon, PanelLeft, PanelLeftClose, PanelLeftOpen, Pencil, PenLine, Percent, Phone, Plus, Quote, RefreshCw, Search, Send,
  Settings, Shield, SlidersHorizontal, Sparkles, Star, Sun, Table2, Tag, Target, Timer, Trash2, TrendingUp, TriangleAlert,
  Trophy, Upload, UserCheck, UserPlus, X, type LucideIcon,
} from "lucide-react";

/**
 * Portal icon set: Lucide, as Plane uses, at a 1.75 stroke.
 * Use <Icon name="..." /> and size it with a className (default size-5).
 */
const icons = {
  dashboard: LayoutDashboard,
  capitol: Landmark,
  briefcase: Briefcase,
  inbox: Inbox,
  bench: Armchair,
  resume: FileUser,
  contact: Contact,
  building: Building2,
  handshake: Handshake,
  pen: PenLine,
  chart: ChartLine,
  quote: Quote,
  megaphone: Megaphone,
  layers: Layers,
  shield: Shield,
  code: Code,
  search: Search,
  bell: Bell,
  plus: Plus,
  filter: ListFilter,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  logout: LogOut,
  settings: Settings,
  idBadge: IdCard,
  calendar: Calendar,
  check: Check,
  x: X,
  dots: Ellipsis,
  dotsVertical: EllipsisVertical,
  upload: Upload,
  download: Download,
  mail: Mail,
  phone: Phone,
  star: Star,
  expand: Maximize2,
  external: ExternalLink,
  clock: Clock,
  map: MapPin,
  dollar: DollarSign,
  eye: Eye,
  edit: Pencil,
  trash: Trash2,
  key: KeyRound,
  globe: Globe,
  activity: Activity,
  menu: Menu,
  sparkle: Sparkles,
  image: Image,
  target: Target,
  trophy: Trophy,
  send: Send,
  userCheck: UserCheck,
  sun: Sun,
  moon: Moon,
  userPlus: UserPlus,
  funnel: Funnel,
  trendUp: TrendingUp,
  percent: Percent,
  timer: Timer,
  award: Award,
  help: CircleHelp,
  alert: TriangleAlert,
  tag: Tag,
  sliders: SlidersHorizontal,
  sidebar: PanelLeft,
  sidebarClose: PanelLeftClose,
  sidebarOpen: PanelLeftOpen,
  refresh: RefreshCw,
  copy: Copy,
  table: Table2,
  lock: Lock,
  board: Kanban,
  collapse: ChevronsRight,
  checkAll: CheckCheck,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export default function Icon({ name, className = "size-5", title }: { name: IconName; className?: string; title?: string }) {
  const Glyph = icons[name];
  return (
    <Glyph className={className} strokeWidth={1.75} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
    </Glyph>
  );
}
