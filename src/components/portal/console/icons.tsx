import type { ComponentType } from "react";
import {
  Armchair, BadgeCheck, Bell, BookOpen, BookOpenText, Bookmark, BookmarkCheck, BookmarkPlus, Boxes, Briefcase, Building, Building2, Calendar, CalendarClock, Camera, ChartColumn, CircleAlert, CircleCheck, CircleHelp, CircleX, ClipboardList, Clock, Cloud, Contact, Copy, DollarSign, Download, Eye, EyeOff, File, FileText, FileUser, Funnel, Globe, Handshake, Hash, History, House, IdCard, Inbox, Info, KeyRound, Landmark, Layers, LayoutDashboard, Link, Lock, LogOut, Mail, MailOpen, MapPin, Menu, MessageSquare, MessageSquareText, Newspaper, PanelLeft, PenLine, Pencil, Percent, Phone, Quote, Radar, RefreshCw, Save, Search, Send, Settings, Shield, ShieldCheck, Signpost, Sparkles, Star, Terminal, Trash2, TrendingUp, TriangleAlert, Truck, Upload, User, UserCheck, UserCog, UserPlus, UserStar, UserX, Users, UsersRound,
  type LucideIcon, type LucideProps,
} from "lucide-react";

/**
 * Any admin icon component. Props typed with this accept these and plain Lucide glyphs alike.
 */
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number | string }>;

/**
 * Console iconography: Lucide, as Plane uses, at the portal's 1.75 stroke.
 * Names describe what the glyph means here (a requisition, a placement), not its shape.
 */
function glyph(G: LucideIcon, name: string) {
  const C = (props: LucideProps) => <G strokeWidth={1.75} aria-hidden {...props} />;
  C.displayName = name;
  return C;
}

export const IconStateRole = glyph(Landmark, "IconStateRole");
export const IconBlog = glyph(PenLine, "IconBlog");
export const IconApplication = glyph(FileText, "IconApplication");
export const IconHrPortal = glyph(IdCard, "IconHrPortal");
export const IconRequisition = glyph(ClipboardList, "IconRequisition");
export const IconPipeline = glyph(Funnel, "IconPipeline");
export const IconConversion = glyph(TrendingUp, "IconConversion");
export const IconTeam = glyph(Users, "IconTeam");
export const IconSource = glyph(Signpost, "IconSource");
export const IconOverview = glyph(LayoutDashboard, "IconOverview");
export const IconBench = glyph(Armchair, "IconBench");
export const IconResume = glyph(FileUser, "IconResume");
export const IconContact = glyph(Contact, "IconContact");
export const IconClient = glyph(Building2, "IconClient");
export const IconVendor = glyph(Handshake, "IconVendor");
export const IconContent = glyph(Layers, "IconContent");
export const IconStaff = glyph(UsersRound, "IconStaff");
export const IconBell = glyph(Bell, "IconBell");
export const IconSidebar = glyph(PanelLeft, "IconSidebar");
export const IconMenu = glyph(Menu, "IconMenu");
export const IconSearch = glyph(Search, "IconSearch");
export const IconHelp = glyph(CircleHelp, "IconHelp");
export const IconKey = glyph(KeyRound, "IconKey");
export const IconRoles = glyph(ShieldCheck, "IconRoles");
export const IconDocs = glyph(BookOpenText, "IconDocs");
export const IconSettings = glyph(Settings, "IconSettings");
export const IconRefresh = glyph(RefreshCw, "IconRefresh");
export const IconAlert = glyph(CircleAlert, "IconAlert");
export const IconWarning = glyph(TriangleAlert, "IconWarning");
export const IconSuccess = glyph(CircleCheck, "IconSuccess");
export const IconError = glyph(CircleX, "IconError");
export const IconInfo = glyph(Info, "IconInfo");
export const IconClock = glyph(Clock, "IconClock");
export const IconHistory = glyph(History, "IconHistory");
export const IconUser = glyph(User, "IconUser");
export const IconUserPlus = glyph(UserPlus, "IconUserPlus");
export const IconUserCheck = glyph(UserCheck, "IconUserCheck");
export const IconUserX = glyph(UserX, "IconUserX");
export const IconUserStar = glyph(UserStar, "IconUserStar");
export const IconUserRole = glyph(UserCog, "IconUserRole");
export const IconGroup = glyph(Users, "IconGroup");
export const IconMail = glyph(Mail, "IconMail");
export const IconMailOpen = glyph(MailOpen, "IconMailOpen");
export const IconPhone = glyph(Phone, "IconPhone");
export const IconMessage = glyph(MessageSquare, "IconMessage");
export const IconMessageText = glyph(MessageSquareText, "IconMessageText");
export const IconSend = glyph(Send, "IconSend");
export const IconBuilding = glyph(Building, "IconBuilding");
export const IconLocation = glyph(MapPin, "IconLocation");
export const IconGlobe = glyph(Globe, "IconGlobe");
export const IconJob = glyph(Briefcase, "IconJob");
export const IconInbox = glyph(Inbox, "IconInbox");
export const IconInterview = glyph(CalendarClock, "IconInterview");
export const IconPlacement = glyph(BadgeCheck, "IconPlacement");
export const IconMoney = glyph(DollarSign, "IconMoney");
export const IconPercent = glyph(Percent, "IconPercent");
export const IconChart = glyph(ChartColumn, "IconChart");
export const IconEdit = glyph(Pencil, "IconEdit");
export const IconTrash = glyph(Trash2, "IconTrash");
export const IconSave = glyph(Save, "IconSave");
export const IconCopy = glyph(Copy, "IconCopy");
export const IconDownload = glyph(Download, "IconDownload");
export const IconUpload = glyph(Upload, "IconUpload");
export const IconEye = glyph(Eye, "IconEye");
export const IconEyeOff = glyph(EyeOff, "IconEyeOff");
export const IconLock = glyph(Lock, "IconLock");
export const IconShield = glyph(Shield, "IconShield");
export const IconLink = glyph(Link, "IconLink");
export const IconCamera = glyph(Camera, "IconCamera");
export const IconStar = glyph(Star, "IconStar");
export const IconBookmark = glyph(Bookmark, "IconBookmark");
export const IconBookmarkCheck = glyph(BookmarkCheck, "IconBookmarkCheck");
export const IconBookmarkPlus = glyph(BookmarkPlus, "IconBookmarkPlus");
export const IconBook = glyph(BookOpen, "IconBook");
export const IconHash = glyph(Hash, "IconHash");
export const IconLayers = glyph(Layers, "IconLayers");
export const IconHome = glyph(House, "IconHome");
export const IconLogout = glyph(LogOut, "IconLogout");
export const IconTerminal = glyph(Terminal, "IconTerminal");
export const IconSparkles = glyph(Sparkles, "IconSparkles");
export const IconRadar = glyph(Radar, "IconRadar");
export const IconCloud = glyph(Cloud, "IconCloud");
export const IconTruck = glyph(Truck, "IconTruck");
export const IconBoxes = glyph(Boxes, "IconBoxes");
export const IconCalendar = glyph(Calendar, "IconCalendar");
export const IconFile = glyph(File, "IconFile");
export const IconNews = glyph(Newspaper, "IconNews");
export const IconQuote = glyph(Quote, "IconQuote");
