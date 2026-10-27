import React, { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string | number;
    label: React.ReactNode;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: React.ReactNode;
    disabled?: boolean;
}

export interface SelectProps {
    value?: string | number | null;
    onChange?: (value: any) => void;
    options: SelectOption[];
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
    searchable?: boolean;
    searchPlaceholder?: string;
    disabled?: boolean;
    error?: string | boolean;
    className?: string;
    triggerClassName?: string;
    dropdownClassName?: string;
    size?: 'sm' | 'md' | 'lg';
    name?: string;
    id?: string;
    required?: boolean;
    clearable?: boolean;
    placement?: 'auto' | 'bottom' | 'top';
    fullWidth?: boolean;
}

export function Select({
    value,
    onChange,
    options = [],
    placeholder = '-- Pilih --',
    icon: PrefixIcon,
    searchable,
    searchPlaceholder = 'Cari pilihan...',
    disabled = false,
    error,
    className,
    triggerClassName,
    dropdownClassName,
    size = 'md',
    name,
    id,
    required = false,
    clearable = false,
    placement = 'auto',
    fullWidth = true,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const generatedId = useId();
    const selectId = id || generatedId;

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Otomatis aktifkan pencarian jika opsi >= 7 kecuali dinyatakan searchable={false}
    const isSearchable = searchable !== undefined ? searchable : options.length >= 7;

    // Cari item yang sedang terpilih
    const selectedOption = useMemo(() => {
        return options.find(opt => String(opt.value) === String(value));
    }, [options, value]);

    // Filter opsi berdasarkan pencarian
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter(opt => {
            const labelStr = typeof opt.label === 'string' ? opt.label : String(opt.value);
            const descStr = opt.description || '';
            return labelStr.toLowerCase().includes(q) || descStr.toLowerCase().includes(q);
        });
    }, [options, searchQuery]);

    // Tutup jika klik di luar
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

    // Hitung posisi buka (ke atas atau ke bawah)
    const updatePlacement = useCallback(() => {
        if (placement === 'top') {
            setOpenUpward(true);
            return;
        }
        if (placement === 'bottom') {
            setOpenUpward(false);
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = Math.min(filteredOptions.length * 48 + (isSearchable ? 52 : 0) + 20, 280);

            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [placement, filteredOptions.length, isSearchable]);

    // Handle buka/tutup
    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePlacement();
            setSearchQuery('');
            const initialIdx = filteredOptions.findIndex(opt => String(opt.value) === String(value));
            setHighlightedIndex(initialIdx >= 0 ? initialIdx : 0);
        }
        setIsOpen(!isOpen);
    };

    // Auto focus ke search input saat dropdown terbuka
    useEffect(() => {
        if (isOpen && isSearchable) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSearchable]);

    // Scroll opsi tersorot ke pandangan
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-select-option]');
            const item = items[highlightedIndex] as HTMLElement;
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (val: string | number) => {
        onChange?.(val);
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.('');
        setSearchQuery('');
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    toggleOpen();
                } else {
                    setHighlightedIndex(prev => {
                        const next = prev + 1;
                        return next < filteredOptions.length ? next : 0;
                    });
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    toggleOpen();
                } else {
                    setHighlightedIndex(prev => {
                        const next = prev - 1;
                        return next >= 0 ? next : filteredOptions.length - 1;
                    });
                }
                break;
            case 'Enter':
            case ' ':
                if (!isOpen) {
                    e.preventDefault();
                    toggleOpen();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                        const opt = filteredOptions[highlightedIndex];
                        if (!opt.disabled) handleSelect(opt.value);
                    }
                }
                break;
            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    setIsOpen(false);
                    triggerRef.current?.focus();
                }
                break;
            case 'Tab':
                if (isOpen) {
                    setIsOpen(false);
                }
                break;
        }
    };

    // Variasi ukuran
    const sizeClasses = {
        sm: 'h-9 text-xs px-3 rounded-xl gap-2',
        md: 'h-11 text-sm px-3.5 rounded-xl gap-2.5',
        lg: 'h-14 text-sm px-4 rounded-xl gap-3',
    }[size];

    const iconSizes = {
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-5',
    }[size];

    return (
        <div
            ref={containerRef}
            className={cn('relative', fullWidth ? 'w-full' : 'inline-block', className)}
            onKeyDown={handleKeyDown}
        >
            {/* Input Tersembunyi untuk kompatibilitas form HTML */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value !== null && value !== undefined ? String(value) : ''}
                    required={required}
                />
            )}

            {/* Tombol Pemicu (Trigger) */}
            <button
                ref={triggerRef}
                id={selectId}
                type="button"
                disabled={disabled}
                onClick={toggleOpen}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={cn(
                    'w-full flex items-center justify-between text-left font-medium transition-all duration-200 select-none outline-none',
                    sizeClasses,
                    // Warna dasar & border
                    'bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200/90 dark:border-zinc-700/80',
                    'hover:bg-white dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600',
                    // Fokus aktif
                    isOpen
                        ? 'bg-white dark:bg-zinc-900 border-[#f5b800] ring-2 ring-[#f5b800]/30 shadow-sm'
                        : 'focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/30',
                    // Error state
                    error && 'border-red-500 focus:ring-red-500/30',
                    // Disabled
                    disabled && 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-zinc-900',
                    triggerClassName
                )}
            >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1">
                    {/* Prefix Icon */}
                    {PrefixIcon && (
                        <PrefixIcon className={cn(iconSizes, 'shrink-0 text-gray-400 group-hover:text-gray-600 dark:text-zinc-500 transition-colors')} />
                    )}

                    {/* Ikon Opsi Terpilih (jika ada) */}
                    {selectedOption?.icon && (
                        <selectedOption.icon className={cn(iconSizes, 'shrink-0 text-[#f5b800]')} />
                    )}

                    {/* Label Teks */}
                    {selectedOption ? (
                        <span className="truncate text-gray-900 dark:text-white font-medium">
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span className="truncate text-gray-400 dark:text-zinc-500 font-normal">
                            {placeholder}
                        </span>
                    )}

                    {/* Badge Opsi Terpilih */}
                    {selectedOption?.badge && (
                        <span className="ml-1.5 shrink-0 inline-flex items-center">
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {/* Tombol Clear */}
                    {clearable && selectedOption && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={handleClear}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            title="Hapus pilihan"
                        >
                            <X className="size-3.5" />
                        </span>
                    )}

                    {/* Chevron Panah */}
                    <ChevronDown
                        className={cn(
                            'size-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 shrink-0',
                            isOpen && 'rotate-180 text-[#f5b800]'
                        )}
                    />
                </div>
            </button>

            {/* Menu Dropdown Terapung (Floating Popup) */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 left-0 right-0 min-w-48 bg-white dark:bg-[#1C1A14] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150',
                        openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                        dropdownClassName
                    )}
                >
                    {/* Search Input (Jika Searchable) */}
                    {isSearchable && (
                        <div className="p-2 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/50">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 text-gray-400 size-3.5" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        setHighlightedIndex(0);
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#f5b800] focus:border-[#f5b800]"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Daftar Pilihan */}
                    <div
                        ref={listRef}
                        role="listbox"
                        className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 px-3 text-center text-xs text-gray-400 dark:text-zinc-500">
                                Tidak ada opsi yang cocok
                            </div>
                        ) : (
                            filteredOptions.map((opt, index) => {
                                const isSelected = String(opt.value) === String(value);
                                const isHighlighted = index === highlightedIndex;
                                const OptIcon = opt.icon;

                                return (
                                    <div
                                        key={String(opt.value)}
                                        data-select-option
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            if (!opt.disabled) handleSelect(opt.value);
                                        }}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={cn(
                                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors cursor-pointer select-none',
                                            // Pilihan terpilih
                                            isSelected
                                                ? 'bg-[#f5b800]/15 text-gray-900 dark:text-white font-semibold'
                                                : isHighlighted
                                                    ? 'bg-gray-100 dark:bg-zinc-800/80 text-gray-900 dark:text-white'
                                                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                                            opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                                            {/* Ikon Opsi */}
                                            {OptIcon && (
                                                <OptIcon
                                                    className={cn(
                                                        'size-4 shrink-0 transition-colors',
                                                        isSelected ? 'text-[#f5b800]' : 'text-gray-400 dark:text-zinc-500'
                                                    )}
                                                />
                                            )}

                                            <div className="truncate flex-1">
                                                <div className="truncate leading-snug">{opt.label}</div>
                                                {opt.description && (
                                                    <div className="text-[11px] font-normal text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                                                        {opt.description}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Opsi Badge */}
                                            {opt.badge && (
                                                <span className="shrink-0">{opt.badge}</span>
                                            )}
                                        </div>

                                        {/* Tanda Centang untuk yang Terpilih */}
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-[#f5b800] text-gray-900 flex items-center justify-center shrink-0 shadow-xs">
                                                <Check className="size-3 stroke-[2.5]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {typeof error === 'string' && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
}

export default Select;
