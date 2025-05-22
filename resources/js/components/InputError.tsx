import React, { HTMLAttributes } from 'react';

interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
    className?: string;
}

export default function InputError({
    message,
    className = '',
    ...props
}: InputErrorProps) {
    return message ? (
        <div className="flex items-center mt-2">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p {...props} className={'text-sm text-red-600 font-medium ' + className}>
                {message}
            </p>
        </div>
    ) : null;
}
