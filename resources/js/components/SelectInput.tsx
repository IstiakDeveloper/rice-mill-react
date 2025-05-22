import React, { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}

export default forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
    { className = '', children, ...props },
    ref
) {
    return (
        <select
            {...props}
            className={
                'block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ease-in-out ' +
                className
            }
            ref={ref}
        >
            {children}
        </select>
    );
});
