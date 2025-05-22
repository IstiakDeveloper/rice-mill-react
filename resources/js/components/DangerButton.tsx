import React, { ButtonHTMLAttributes } from 'react';

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    disabled?: boolean;
    children: React.ReactNode;
    loading?: boolean;
}

export default function DangerButton({
    className = '',
    disabled,
    children,
    loading = false,
    ...props
}: DangerButtonProps) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center px-6 py-3 bg-red-600 border border-transparent rounded-lg font-semibold text-sm text-white uppercase tracking-wide hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ease-in-out ${
                    (disabled || loading) && 'opacity-50 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled || loading}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}
