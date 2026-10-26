<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_barang',
        'nama',
        'gambar',
        'kategori_id',
        'satuan',
        'harga_beli',
        'harga_jual',
        'harga_grosir', 
        'min_qty_grosir',
        'stok_minimum',
        'aktif',
    ];

    protected function casts(): array
    {
        return [
            'harga_beli' => 'integer',
            'harga_jual' => 'integer',
            'stok' => 'decimal:2',
            'stok_minimum' => 'decimal:2',
            'harga_grosir' => 'integer',
            'min_qty_grosir' => 'decimal:2',
            'aktif' => 'boolean',
        ];
    }

    // ============ Relasi ============

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'kategori_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function stockIns(): HasMany
    {
        return $this->hasMany(StockIn::class);
    }

    public function stockOuts(): HasMany
    {
        return $this->hasMany(StockOut::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    // ============ Scopes ============

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('aktif', true);
    }

    public function scopeCari(Builder $query, string $keyword): Builder
    {
        return $query->where(function (Builder $q) use ($keyword) {
            $q->where('kode_barang', 'like', "%{$keyword}%")
                ->orWhere('nama', 'like', "%{$keyword}%");
        });
    }

    public function scopeStokMenipis(Builder $query): Builder
    {
        return $query->whereColumn('stok', '<=', 'stok_minimum')
            ->where('stok_minimum', '>', 0);
    }

    // ============ Helper ============

    public function isStokRendah(): bool
    {
        return $this->stok_minimum > 0 && $this->stok <= $this->stok_minimum;
    }

    /**
     * PENTING: Method ini TIDAK BOLEH dipakai untuk ubah stok.
     * Perubahan stok WAJIB lewat StockService agar selalu tercatat
     * di stock_movements. Method ini hanya untuk keperluan testing/admin darurat.
     */
    public function setStokLangsung(float $stok): void
    {
        $this->stok = $stok;
        $this->save();
    }
}