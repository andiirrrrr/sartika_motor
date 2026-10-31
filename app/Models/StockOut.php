<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOut extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'qty',
        'harga_beli',
        'alasan',
        'catatan',
        'tanggal',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:2',
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

    public function getLabelAlasanAttribute(): string
    {
        return match ($this->alasan) {
            'rusak' => 'Rusak',
            'hilang' => 'Hilang',
            'pemakaian_sendiri' => 'Pemakaian Sendiri',
            'koreksi' => 'Koreksi',
            default => $this->alasan,
        };
    }
}
