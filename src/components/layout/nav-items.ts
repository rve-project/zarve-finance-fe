import {
  AlertTriangle,
  BarChart3,
  Banknote,
  BookOpen,
  Boxes,
  Car,
  ClipboardCheck,
  Contact as ContactIcon,
  FileSignature,
  FileSpreadsheet,
  Home,
  History,
  MapPinOff,
  PackageCheck,
  Receipt,
  ReceiptText,
  Scale,
  ShoppingCart,
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
  /** Only shown when the signed-in user has this flag on their account (see
   * useAuth().user) -- currently just "canViewActivityLog" (D'Consulting audit gap #10).
   * Sidebar.tsx is what actually filters on this. */
  requiresUserFlag?: "canViewActivityLog";
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
      { labelKey: "nav.kasBank", href: "/b2b-kas-bank", icon: Wallet },
      { labelKey: "nav.pengeluaran", href: "/b2b-expenses", icon: ReceiptText },
      { labelKey: "nav.penjualan", href: "/b2b-sales", icon: Banknote },
      { labelKey: "nav.pembelian", href: "/b2b-purchases", icon: ShoppingCart },
    ],
  },
  {
    titleKey: "section.operasionalB2b",
    items: [
      { labelKey: "nav.daftarAkunB2b", href: "/b2b-accounts", icon: BookOpen },
      { labelKey: "nav.kontak", href: "/b2b-contacts", icon: ContactIcon },
      { labelKey: "nav.produk", href: "/b2b-produk", icon: ShoppingBag },
      { labelKey: "nav.pemenuhan", href: "/b2b-pemenuhan", icon: PackageCheck },
      { labelKey: "nav.asetTetap", href: "/b2b-fixed-assets", icon: Boxes },
    ],
  },
  {
    // Everything below is specific to the Zarve rental business -- its own drivers,
    // vehicles, vendors, and invoices mirrored/recapped from Zarve's own system, not
    // shared with B2B's separate bookkeeping above.
    titleKey: "section.zarve",
    items: [
      { labelKey: "nav.invoice", href: "/invoices", icon: Receipt },
      { labelKey: "nav.rekapRevenue", href: "/revenue-recap", icon: TrendingUp },
      { labelKey: "nav.driverPartner", href: "/partners", icon: Users },
      { labelKey: "nav.vendorSupplier", href: "/vendors", icon: Store },
      { labelKey: "nav.kendaraan", href: "/vehicles", icon: Car },
      { labelKey: "nav.tagihanVendor", href: "/vendor-bills", icon: Receipt },
      { labelKey: "nav.rekonsiliasiBank", href: "/reconciliation", icon: Wallet },
      { labelKey: "nav.sinkronisasiData", href: "/import", icon: FileSpreadsheet },
      { labelKey: "nav.piutangJatuhTempo", href: "/reports/aged-receivables", icon: AlertTriangle },
      { labelKey: "nav.profitabilitasKendaraan", href: "/reports/vehicle-profitability", icon: Car },
      { labelKey: "nav.keluarKota", href: "/reports/geofence-violations", icon: MapPinOff },
    ],
  },
  {
    // These report pages already existed (built, translated, working) but were never
    // linked from the sidebar -- reachable only by typing the URL directly. Business-
    // unit-aware (they read whichever unit's currently selected via the X-Business-Unit
    // header), so this section sits between Zarve and Administrasi rather than inside
    // either one.
    titleKey: "section.laporanKeuangan",
    items: [
      { labelKey: "nav.jurnalManual", href: "/journal-entries", icon: FileSignature },
      { labelKey: "nav.trialBalance", href: "/reports/trial-balance", icon: BarChart3 },
      { labelKey: "nav.generalLedger", href: "/reports/general-ledger", icon: BookOpen },
      { labelKey: "nav.labaRugi", href: "/reports/profit-loss", icon: TrendingUp },
      { labelKey: "nav.neraca", href: "/reports/balance-sheet", icon: Scale },
      { labelKey: "nav.arusKas", href: "/reports/cash-flow", icon: Wallet },
    ],
  },
  {
    titleKey: "section.administrasi",
    items: [
      { labelKey: "nav.manajemenUser", href: "/users", icon: UserCog },
      { labelKey: "nav.pengaturan", href: "/settings", icon: Settings },
      { labelKey: "nav.validasiJurnal", href: "/validasi-jurnal", icon: ClipboardCheck },
      { labelKey: "nav.logAktivitas", href: "/log-aktivitas", icon: History, requiresUserFlag: "canViewActivityLog" },
    ],
  },
];
