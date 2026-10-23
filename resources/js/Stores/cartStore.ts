import { create } from 'zustand';

export interface CartItem {
    product_id: number;
    kode_barang: string;
    nama: string;
    harga_jual: number;
    harga_grosir: number | null;
    min_qty_grosir: number | null;
    stok_tersedia: number;
    qty: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'qty'>) => void;
    updateQty: (productId: number, qty: number) => void;
    removeItem: (productId: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemPrice: (item: CartItem) => number; // Fungsi baru untuk cek harga aktif
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addItem: (item) => {
        set((state) => {
            const existing = state.items.find((i) => i.product_id === item.product_id);
            if (existing) {
                const newQty = Math.min(existing.qty + 1, existing.stok_tersedia);
                return {
                    items: state.items.map((i) =>
                        i.product_id === item.product_id ? { ...i, qty: newQty } : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, qty: 1 }] };
        });
    },
    updateQty: (productId, qty) => {
        set((state) => ({
            items: state.items.map((i) => {
                if (i.product_id === productId) {
                    const validQty = Math.max(1, Math.min(qty, i.stok_tersedia));
                    return { ...i, qty: validQty };
                }
                return i;
            }),
        }));
    },
    removeItem: (productId) => {
        set((state) => ({
            items: state.items.filter((i) => i.product_id !== productId),
        }));
    },
    clearCart: () => set({ items: [] }),

    // Fungsi helper untuk menentukan harga satuan berdasarkan qty
    getItemPrice: (item) => {
        if (item.harga_grosir && item.min_qty_grosir && item.qty >= item.min_qty_grosir) {
            return item.harga_grosir;
        }
        return item.harga_jual;
    },

    getTotal: () => {
        return get().items.reduce((total, item) => {
            const activePrice = get().getItemPrice(item);
            return total + activePrice * item.qty;
        }, 0);
    },
}));