import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Boxes,
  Car,
  Contact as ContactIcon,
  FileSpreadsheet,
  Home,
  MapPinOff,
  PackageCheck,
  Receipt,
  ReceiptText,
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
    titleKey: "section.administrasi",
    items: [
      { labelKey: "nav.manajemenUser", href: "/users", icon: UserCog },
      { labelKey: "nav.pengaturan", href: "/settings", icon: Settings },
    ],
  },
];
