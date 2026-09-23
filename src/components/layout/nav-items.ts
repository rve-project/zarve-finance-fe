import {
  AlertTriangle,
  BookOpen,
  BookText,
  Boxes,
  Car,
  Contact as ContactIcon,
  FileSpreadsheet,
  FileText,
  Home,
  Landmark,
  MapPinOff,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Shown only when the current business unit is B2B -- everything else is Zarve's
   * menu and stays hidden in B2B mode until real B2B menu items get built. */
  b2bOnly?: boolean;
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
      { labelKey: "nav.b2bDashboard", href: "/b2b-dashboard", icon: Landmark, b2bOnly: true },
      { labelKey: "nav.kasBank", href: "/b2b-kas-bank", icon: Wallet, b2bOnly: true },
      { labelKey: "nav.invoice", href: "/invoices", icon: Receipt },
      { labelKey: "nav.rekapRevenue", href: "/revenue-recap", icon: TrendingUp },
    ],
  },
  {
    titleKey: "section.operasionalB2b",
    items: [
      { labelKey: "nav.kontak", href: "/b2b-contacts", icon: ContactIcon, b2bOnly: true },
      { labelKey: "nav.daftarAkunB2b", href: "/b2b-accounts", icon: BookOpen, b2bOnly: true },
      { labelKey: "nav.produk", href: "/b2b-produk", icon: ShoppingBag, b2bOnly: true },
      { labelKey: "nav.pemenuhan", href: "/b2b-pemenuhan", icon: PackageCheck, b2bOnly: true },
      { labelKey: "nav.asetTetap", href: "/b2b-fixed-assets", icon: Boxes, b2bOnly: true },
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
      { labelKey: "nav.manajemenUser", href: "/users", icon: UserCog },
      { labelKey: "nav.pengaturan", href: "/settings", icon: Settings },
      { labelKey: "nav.pengaturanB2b", href: "/b2b-settings", icon: Settings, b2bOnly: true },
    ],
  },
];
