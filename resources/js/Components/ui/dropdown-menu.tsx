import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    toggle: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggle = () => setIsOpen(prev => !prev);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, toggle }}>
            <div ref={containerRef} className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
}

export function DropdownMenuTrigger({
    children,
    className,
    asChild = false,
}: {
    children: React.ReactNode;
    className?: string;
    asChild?: boolean;
}) {
    const context = useContext(DropdownMenuContext);
    if (!context) throw new Error('DropdownMenuTrigger must be inside DropdownMenu');

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                (children as any).props?.onClick?.(e);
                context.toggle();
            },
            'aria-expanded': context.isOpen,
        });
    }

    return (
        <button
            type="button"
            onClick={context.toggle}
            aria-expanded={context.isOpen}
            className={cn('inline-flex items-center outline-none', className)}
        >
            {children}
        </button>
    );
}

export function DropdownMenuContent({
    children,
    className,
    align = 'end',
    width = 'w-56',
}: {
    children: React.ReactNode;
    className?: string;
    align?: 'start' | 'end' | 'center';
    width?: string;
}) {
    const context = useContext(DropdownMenuContext);
    if (!context) throw new Error('DropdownMenuContent must be inside DropdownMenu');

    if (!context.isOpen) return null;

    const alignClasses = {
        start: 'left-0',
        end: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    }[align];

    return (
        <div
            className={cn(
                'absolute z-50 mt-2 bg-white dark:bg-[#1C1A14] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150 select-none',
                width,
                alignClasses,
                className
            )}
        >
            {children}
        </div>
    );
}

export function DropdownMenuItem({
    children,
    onClick,
    disabled = false,
    destructive = false,
    icon: Icon,
    className,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    destructive?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}) {
    const context = useContext(DropdownMenuContext);

    const handleClick = () => {
        if (disabled) return;
        onClick?.();
        context?.setIsOpen(false);
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left outline-none cursor-pointer',
                destructive
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white',
                disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
                className
            )}
        >
            {Icon && (
                <Icon
                    className={cn(
                        'size-4 shrink-0 transition-colors',
                        destructive ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'
                    )}
                />
            )}
            <span className="flex-1 truncate">{children}</span>
        </button>
    );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
    return (
        <div className={cn('h-px bg-gray-100 dark:bg-zinc-800/80 my-1 -mx-1.5', className)} />
    );
}

export function DropdownMenuLabel({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider', className)}>
            {children}
        </div>
    );
}
