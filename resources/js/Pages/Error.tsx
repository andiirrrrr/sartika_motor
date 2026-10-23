import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

interface Props {
    status: number;
}

const titles: Record<number, string> = {
    403: 'Akses Ditolak',
    404: 'Halaman Tidak Ditemukan',
    500: 'Terjadi Kesalahan Server',
    503: 'Layanan Tidak Tersedia',
};

const descriptions: Record<number, string> = {
    403: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
    404: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan.',
    500: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
    503: 'Server sedang dalam pemeliharaan. Silakan coba lagi nanti.',
};

export default function Error({ status }: Props) {
    const title = titles[status] ?? 'Terjadi Kesalahan';
    const description = descriptions[status] ?? 'Silakan coba lagi.';

    return (
        <>
            <Head title={`${status} - ${title}`} />
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                    <h1 className="text-6xl font-bold text-gray-800">
                        {status}
                    </h1>
                    <h2 className="mt-4 text-xl font-semibold text-gray-700">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">{description}</p>

                    <div className="mt-6">
                        <Link href="/">
                            <Button>Kembali ke Beranda</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}