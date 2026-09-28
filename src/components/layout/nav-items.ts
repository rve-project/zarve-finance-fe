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
import type { ModuleKey } from "@/lib/permissions";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Only shown when the signed-in user has this flag on their account (see
   * useAuth().user) -- currently just "canViewActivityLog" (D'Consulting audit gap #10).
   * Sidebar.tsx is what actually filters on this. */
  requiresUserFlag?: "canViewActivityLog";
  /** Sidebar section this item belongs to, for the per-user menu restriction set on the
   * Manajemen User page (see src/lib/permissions.ts). Omitted for Beranda, which is
   * always reachable. */
  module?: ModuleKey;
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
      { labelKey: "nav.kasBank", href: "/b2b-kas-bank", icon: Wallet, module: "b2b-utama" },
      { labelKey: "nav.pengeluaran", href: "/b2b-expenses", icon: ReceiptText, module: "b2b-utama" },
      { labelKey: "nav.penjualan", href: "/b2b-sales", icon: Banknote, module: "b2b-utama" },
      { labelKey: "nav.pembelian", href: "/b2b-purchases", icon: ShoppingCart, module: "b2b-utama" },
    ],
  },
  {
    titleKey: "section.operasionalB2b",
    items: [
      { labelKey: "nav.daftarAkunB2b", href: "/b2b-accounts", icon: BookOpen, module: "b2b-operasional" },
      { labelKey: "nav.kontak", href: "/b2b-contacts", icon: ContactIcon, module: "b2b-operasional" },
      { labelKey: "nav.produk", href: "/b2b-produk", icon: ShoppingBag, module: "b2b-operasional" },
      { labelKey: "nav.pemenuhan", href: "/b2b-pemenuhan", icon: PackageCheck, module: "b2b-operasional" },
      { labelKey: "nav.asetTetap", href: "/b2b-fixed-assets", icon: Boxes, module: "b2b-operasional" },
    ],
  },
  {
    // Everything below is specific to the Zarve rental business -- its own drivers,
    // vehicles, vendors, and invoices mirrored/recapped from Zarve's own system, not
    // shared with B2B's separate bookkeeping above.
    titleKey: "section.zarve",
    items: [
      { labelKey: "nav.invoice", href: "/invoices", icon: Receipt, module: "zarve" },
      { labelKey: "nav.rekapRevenue", href: "/revenue-recap", icon: TrendingUp, module: "zarve" },
      { labelKey: "nav.driverPartner", href: "/partners", icon: Users, module: "zarve" },
      { labelKey: "nav.vendorSupplier", href: "/vendors", icon: Store, module: "zarve" },
      { labelKey: "nav.kendaraan", href: "/vehicles", icon: Car, module: "zarve" },
      { labelKey: "nav.tagihanVendor", href: "/vendor-bills", icon: Receipt, module: "zarve" },
      { labelKey: "nav.rekonsiliasiBank", href: "/reconciliation", icon: Wallet, module: "zarve" },
      { labelKey: "nav.sinkronisasiData", href: "/import", icon: FileSpreadsheet, module: "zarve" },
      { labelKey: "nav.piutangJatuhTempo", href: "/reports/aged-receivables", icon: AlertTriangle, module: "zarve" },
      { labelKey: "nav.profitabilitasKendaraan", href: "/reports/vehicle-profitability", icon: Car, module: "zarve" },
      { labelKey: "nav.keluarKota", href: "/reports/geofence-violations", icon: MapPinOff, module: "zarve" },
    ],
  },
  {
    // These report pages already existed (built, translated, working) but were never
    // linked from the sidebar -- reachable only by typing the URL directly. Each page has
    // its own Zarve/B2B toggle (defaulting to B2B) instead of a separate URL per unit --
    // see BusinessUnitToggle usage inside each page.
    titleKey: "section.laporanKeuangan",
    items: [
      { labelKey: "nav.jurnalManual", href: "/journal-entries", icon: FileSignature, module: "laporan-keuangan" },
      { labelKey: "nav.trialBalance", href: "/reports/trial-balance", icon: BarChart3, module: "laporan-keuangan" },
      { labelKey: "nav.generalLedger", href: "/reports/general-ledger", icon: BookOpen, module: "laporan-keuangan" },
      { labelKey: "nav.labaRugi", href: "/reports/profit-loss", icon: TrendingUp, module: "laporan-keuangan" },
      { labelKey: "nav.neraca", href: "/reports/balance-sheet", icon: Scale, module: "laporan-keuangan" },
      { labelKey: "nav.arusKas", href: "/reports/cash-flow", icon: Wallet, module: "laporan-keuangan" },
    ],
  },
  {
    titleKey: "section.administrasi",
    items: [
      { labelKey: "nav.manajemenUser", href: "/users", icon: UserCog, module: "administrasi" },
      { labelKey: "nav.pengaturan", href: "/settings", icon: Settings, module: "administrasi" },
      { labelKey: "nav.validasiJurnal", href: "/validasi-jurnal", icon: ClipboardCheck, module: "administrasi" },
      {
        labelKey: "nav.logAktivitas",
        href: "/log-aktivitas",
        icon: History,
        requiresUserFlag: "canViewActivityLog",
        module: "administrasi",
      },
    ],
  },
];
