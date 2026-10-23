<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductsExport implements FromCollection, WithHeadings, WithMapping
{
    // Tambahkan : Collection di sini
    public function collection(): Collection
    {
        return Product::with('kategori')->get();
    }

    public function headings(): array
    {
        return [
            'kode_barang', 'nama', 'kategori', 'satuan', 
            'harga_beli', 'harga_jual', 'harga_grosir', 
            'min_qty_grosir', 'stok', 'stok_minimum'
        ];
    }

    public function map($product): array
    {
        return [
            $product->kode_barang,
            $product->nama,
            $product->kategori ? $product->kategori->nama : '',
            $product->satuan,
            $product->harga_beli,
            $product->harga_jual,
            $product->harga_grosir,
            $product->min_qty_grosir,
            (float) $product->stok,
            (float) $product->stok_minimum,
        ];
    }
}