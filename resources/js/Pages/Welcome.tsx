import { Head } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

interface Props {
    laravelVersion: string;
    phpVersion: string;
}

export default function Welcome({ laravelVersion, phpVersion }: Props) {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="rounded-lg bg-white p-10 shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-800">
                        🎉 shadcn/ui Siap
                    </h1>
                    <p className="mt-4 text-gray-600">Laravel {laravelVersion}</p>
                    <p className="text-gray-600">PHP {phpVersion}</p>
                    <div className="mt-6 flex gap-2">
                        <Button>Default</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="destructive">Destructive</Button>
                    </div>
                </div>
            </div>
        </>
    );
}