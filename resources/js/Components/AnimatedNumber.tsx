import { useEffect, useRef } from 'react';

interface AnimatedNumberProps {
    value: number | string | null | undefined;
    duration?: number; // In milliseconds (default: 650ms)
    formatter?: (val: number) => string;
    prefix?: string;
    suffix?: string;
    className?: string;
}

// Cubic ease-out for snappy, premium feel
const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
};

export default function AnimatedNumber({
    value,
    duration = 650,
    formatter,
    prefix = '',
    suffix = '',
    className = '',
}: AnimatedNumberProps) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const prevValueRef = useRef<number>(0);

    const parseNum = (v: number | string | null | undefined): number => {
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        if (!v) return 0;
        const parsed = parseFloat(String(v).replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    const format = (n: number | string | null | undefined) => {
        const num = parseNum(n);
        if (formatter) return formatter(num);
        return new Intl.NumberFormat('id-ID').format(num);
    };

    useEffect(() => {
        const span = spanRef.current;
        if (!span) return;

        const endVal = parseNum(value);
        const startVal = prevValueRef.current;

        // Respect user accessibility preference for reduced motion
        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion || duration <= 0 || startVal === endVal) {
            span.textContent = `${prefix}${format(endVal)}${suffix}`;
            prevValueRef.current = endVal;
            return;
        }

        const startTime = performance.now();
        let animationFrameId: number;

        const updateNumber = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            // Safe numeric interpolation for both increasing and decreasing numbers
            const currentNumber = Math.round(startVal + (endVal - startVal) * easedProgress);
            span.textContent = `${prefix}${format(currentNumber)}${suffix}`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(updateNumber);
            } else {
                span.textContent = `${prefix}${format(endVal)}${suffix}`;
                prevValueRef.current = endVal;
            }
        };

        animationFrameId = requestAnimationFrame(updateNumber);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [value, duration, prefix, suffix]);

    return (
        <span ref={spanRef} className={className}>
            {prefix}{format(value)}{suffix}
        </span>
    );
}
