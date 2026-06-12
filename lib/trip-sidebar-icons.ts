import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpenText,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  MessageCircle,
  ReceiptText,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { TripTabKey } from "@/lib/trip-tab-assets";

export const TRIP_SIDEBAR_ICONS: Partial<Record<TripTabKey, LucideIcon>> = {
  summary: LayoutDashboard,
  plan: CalendarDays,
  map: Map,
  today: Clock3,
  expenses: ReceiptText,
  participants: UsersRound,
  resources: FileText,
  chat: Sparkles,
  recap: BookOpenText,
  settings: Settings,
  announcements: Bell,
  messages: MessageCircle,
  payments: CreditCard,
};
