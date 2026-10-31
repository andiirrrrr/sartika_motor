<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'no_transaksi',
        'tanggal',
        'total',
        'metode_bayar',
        'bayar',
        'kembalian',
        'nama_pelanggan',
        'no_wa',
        'kasir_id',
        'shift_id',
        'payment_method_id',
        'status',
        'idempotency_key',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime',
            'voided_at' => 'datetime',
            'total' => 'integer',
            'bayar' => 'integer',
            'kembalian' => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function scopeSelesai(Builder $query): Builder
    {
        return $query->where('status', 'selesai');
    }

    public function scopeRentangTanggal(Builder $query, string $dari, string $sampai): Builder
    {
        return $query->whereBetween('tanggal', [
            $dari.' 00:00:00',
            $sampai.' 23:59:59',
        ]);
    }
}
