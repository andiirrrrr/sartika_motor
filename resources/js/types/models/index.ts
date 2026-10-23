export interface Category {
    id: number;
    nama: string;
}

export interface Product {
    id: number;
    kode_barang: string;
    nama: string;
    kategori_id: number | null;
    kategori?: Category;
    satuan: string;
    harga_beli: number;
    harga_jual: number;
    stok: string; // decimal dari Laravel datang sebagai string
    stok_minimum: string;
    aktif: boolean;
    created_at: string;
    updated_at: string;
}

export interface StockMovement {
    id: number;
    product_id: number;
    product?: Product;
    tipe: 'masuk' | 'keluar' | 'penjualan' | 'koreksi';
    qty: string;
    stok_setelah: string;
    harga_beli: number | null;
    alasan: string | null;
    catatan: string | null;
    referensi_tipe: string | null;
    referensi_id: number | null;
    tanggal: string;
    created_by: number | null;
    created_at: string;
}

export interface StockIn {
    id: number;
    product_id: number;
    product?: Product;
    qty: string;
    harga_beli: number;
    sumber: string | null;
    catatan: string | null;
    tanggal: string;
    created_by: number | null;
    created_at: string;
}

export interface StockOut {
    id: number;
    product_id: number;
    product?: Product;
    qty: string;
    alasan: 'rusak' | 'hilang' | 'pemakaian_sendiri' | 'koreksi';
    catatan: string | null;
    tanggal: string;
    created_by: number | null;
    created_at: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    kode_barang: string;
    nama_produk: string;
    qty: string;
    harga_jual: number;
    subtotal: number;
}

export interface Sale {
    id: number;
    no_transaksi: string;
    tanggal: string;
    total: number;
    metode_bayar: 'tunai' | 'transfer' | 'qris';
    bayar: number;
    kembalian: number;
    kasir_id: number;
    kasir?: {
        id: number;
        nama: string;
        username: string;
    };
    items?: SaleItem[];
    created_at: string;
}