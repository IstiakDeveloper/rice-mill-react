import React, { LabelHTMLAttributes } from 'react';

interface InputLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    value?: string;
    children?: React.ReactNode;
    required?: boolean;
}

export default function InputLabel({
    value,
    className = '',
    children,
    required = false,
    ...props
}: InputLabelProps) {
    return (
        <label
            {...props}
            className={`block text-sm font-semibold text-gray-700 mb-2 ` + className}
        >
            {value ? value : children}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );
}
