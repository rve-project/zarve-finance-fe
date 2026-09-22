import {
  AlertTriangle,
  BookOpen,
  BookText,
  Car,
  FileSpreadsheet,
  FileText,
  Home,
  Landmark,
  MapPinOff,
  Receipt,
  ScrollText,
  Settings,
  Store,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    titleKey: "section.utama",
    items: [
      { labelKey: "nav.beranda", href: "/", icon: Home },
      { labelKey: "nav.invoice", href: "/invoices", icon: Receipt },
      { labelKey: "nav.rekapRevenue", href: "/revenue-recap", icon: TrendingUp },
    ],
  },
  {
    titleKey: "section.masterData",
    items: [
      { labelKey: "nav.driverPartner", href: "/partners", icon: Users },
      { labelKey: "nav.vendorSupplier", href: "/vendors", icon: Store },
      { labelKey: "nav.kendaraan", href: "/vehicles", icon: Car },
      { labelKey: "nav.chartOfAccounts", href: "/accounts", icon: BookOpen },
    ],
  },
  {
    titleKey: "section.akuntansi",
    items: [
      { labelKey: "nav.jurnalManual", href: "/journal-entries", icon: BookText },
      { labelKey: "nav.tagihanVendor", href: "/vendor-bills", icon: Receipt },
      { labelKey: "nav.rekonsiliasiBank", href: "/reconciliation", icon: Wallet },
    ],
  },
  {
    titleKey: "section.laporanKeuangan",
    items: [
      { labelKey: "nav.trialBalance", href: "/reports/trial-balance", icon: ScrollText },
      { labelKey: "nav.generalLedger", href: "/reports/general-ledger", icon: FileText },
      { labelKey: "nav.labaRugi", href: "/reports/profit-loss", icon: FileText },
      { labelKey: "nav.neraca", href: "/reports/balance-sheet", icon: Landmark },
      { labelKey: "nav.arusKas", href: "/reports/cash-flow", icon: Landmark },
      { labelKey: "nav.piutangJatuhTempo", href: "/reports/aged-receivables", icon: AlertTriangle },
      { labelKey: "nav.profitabilitasKendaraan", href: "/reports/vehicle-profitability", icon: Car },
      { labelKey: "nav.keluarKota", href: "/reports/geofence-violations", icon: MapPinOff },
    ],
  },
  {
    titleKey: "section.administrasi",
    items: [
      { labelKey: "nav.sinkronisasiData", href: "/import", icon: FileSpreadsheet },
      { labelKey: "nav.pengaturan", href: "/settings", icon: Settings },
    ],
  },
];
