import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
    value: string | undefined;
    onChange: (value: string) => void;
    isEditMode: boolean;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span' | 'p';
    autoFocus?: boolean;
    renderView?: (value: string) => React.ReactNode;
}

const EditableText: React.FC<EditableTextProps> = ({
    value = '',
    onChange,
    isEditMode,
    placeholder = 'Empty',
    className = '',
    multiline = false,
    tagName = 'div',
    autoFocus = false,
    renderView
}) => {
    const [inputValue, setInputValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditMode && autoFocus) {
            if (multiline && textareaRef.current) {
                textareaRef.current.focus();
            } else if (!multiline && inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isEditMode, autoFocus, multiline]);

    // Auto-resize textarea
    useEffect(() => {
        if (multiline && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue, multiline, isEditMode]);

    if (!isEditMode) {
        if (!value) return null; // specific requirement: hide if empty in preview
        if (renderView) {
            return <div className={className}>{renderView(value)}</div>;
        }
        const Tag = tagName as any;
        return <Tag className={className}>{value}</Tag>;
    }

    if (multiline) {
        return (
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder={placeholder}
                className={`w-full bg-transparent border-none outline-none resize-none focus:ring-0 p-0 placeholder:text-slate-300 ${className}`}
                rows={1}
            />
        );
    }

    return (
        <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                onChange(e.target.value);
            }}
            placeholder={placeholder}
            className={`w-full bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-300 ${className}`}
        />
    );
};

export default EditableText;
