import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: PaginationLink[];
}

export default function Pagination({ links }: Props) {
    if (links.length <= 3) return null;

    return (
        <div className="flex items-center justify-center gap-1">
            {links.map((link, i) => {
                const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                const isNext = link.label.includes('Next') || link.label.includes('&raquo;');

                const label = isPrev ? <ChevronLeft className="size-4" /> : isNext ? <ChevronRight className="size-4" /> : link.label;

                if (!link.url) {
                    return (
                        <span key={i} className="flex h-9 w-9 items-center justify-center rounded-md border text-sm text-gray-400">
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={cn(
                            'flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors',
                            link.active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        )}
                        preserveScroll
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}