import { Link, usePage } from '@inertiajs/react';
import {
    Tags, LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
    ShoppingCart, Receipt, BarChart3, Users, ChevronLeft, ChevronRight, Settings, Truck, Clock
} from 'lucide-react';
import { useAuth } from '@/Hooks/useAuth';
import { cn } from '@/lib/utils';

interface MenuItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kategori', href: '/categories', icon: Tags, adminOnly: true },
    { label: 'Produk', href: '/products', icon: Package, adminOnly: true },
    { label: 'Stok Masuk', href: '/stock-in', icon: ArrowDownToLine, adminOnly: true },
    { label: 'Stok Keluar', href: '/stock-out', icon: ArrowUpFromLine, adminOnly: true },
    { label: 'Riwayat Transaksi', href: '/sales', icon: Receipt, adminOnly: true },
    { label: 'Laporan', href: '/reports', icon: BarChart3, adminOnly: true },
    { label: 'Manajemen User', href: '/users', icon: Users, adminOnly: true },
    { label: 'Shift Kasir', href: '/shifts', icon: Clock, adminOnly: true },
    { label: 'Supplier', href: '/suppliers', icon: Truck, adminOnly: true },
    { label: 'Pengaturan', href: '/settings', icon: Settings, adminOnly: true },
    { label: 'POS', href: '/pos', icon: ShoppingCart },
];

interface Props {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse }: Props) {
    const { isAdmin } = useAuth();
    const { url } = usePage();

    const visibleItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

    return (
        <aside className={cn(
            "flex h-screen flex-col border-r bg-white transition-all duration-300 dark:bg-zinc-950 dark:border-zinc-800",
            isCollapsed ? "w-16" : "w-60"
        )}>
            <div className="flex h-14 items-center justify-between border-b px-4 dark:border-zinc-800">
                {!isCollapsed && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="text-lg font-bold">Sartika Motor</h1>
                        <p className="text-[10px] text-gray-500">Inventory & POS</p>
                    </div>
                )}
                <button onClick={toggleCollapse} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
                    {isCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = url === item.href || url.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-900',
                                isCollapsed && 'justify-center px-0'
                            )}
                        >
                            <Icon className="size-5 shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}