<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'tipe',
        'qty',
        'stok_setelah',
        'harga_beli',
        'alasan',
        'catatan',
        'referensi_tipe',
        'referensi_id',
        'tanggal',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:2',
            'stok_setelah' => 'decimal:2',
            'harga_beli' => 'integer',
            'tanggal' => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeUntukProduk(Builder $query, int $productId): Builder
    {
        return $query->where('product_id', $productId);
    }

    public function getLabelTipeAttribute(): string
    {
        return match ($this->tipe) {
            'masuk' => 'Stok Masuk',
            'keluar' => 'Stok Keluar',
            'penjualan' => 'Penjualan',
            'koreksi' => 'Koreksi',
            default => $this->tipe,
        };
    }
}