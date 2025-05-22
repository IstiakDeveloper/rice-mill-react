import React, { forwardRef, useEffect, useImperativeHandle, useRef, TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    isFocused?: boolean;
}

export default forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
    { className = '', isFocused = false, ...props },
    ref
) {
    const localRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, []);

    return (
        <textarea
            {...props}
            className={
                'block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ease-in-out placeholder:text-gray-400 resize-none ' +
                className
            }
            ref={localRef}
        />
    );
});
