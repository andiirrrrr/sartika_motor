<?php

namespace App\Exceptions;

use App\Models\Product;
use RuntimeException;

class StokTidakCukupException extends RuntimeException
{
    public function __construct(
        public readonly Product $product,
        public readonly float $stokTersedia,
        public readonly float $stokDiminta,
    ) {
        parent::__construct(
            "Stok {$product->nama} tidak cukup. " .
            "Tersedia: {$stokTersedia}, diminta: {$stokDiminta}."
        );
    }

    public function getProduct(): Product
    {
        return $this->product;
    }
}