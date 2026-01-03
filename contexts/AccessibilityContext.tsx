import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'normal' | 'large' | 'huge';
type FontFamily = 'system' | 'serif';

interface AccessibilityContextType {
    fontSize: FontSize;
    fontFamily: FontFamily;
    setFontSize: (size: FontSize) => void;
    setFontFamily: (font: FontFamily) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from local storage or default
    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        return (localStorage.getItem('acc_fontSize') as FontSize) || 'normal';
    });
    const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
        return (localStorage.getItem('acc_fontFamily') as FontFamily) || 'system';
    });

    // Helper to persist and apply state
    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
        localStorage.setItem('acc_fontSize', size);
    };

    const setFontFamily = (font: FontFamily) => {
        setFontFamilyState(font);
        localStorage.setItem('acc_fontFamily', font);
    };

    // Apply strict side effects to the HTML root element
    useEffect(() => {
        const root = document.documentElement;

        // 1. Font Size Scaling (affecting REM units)
        // Tailwind default base is 16px (100%)
        if (fontSize === 'normal') {
            root.style.fontSize = '16px'; // 100%
        } else if (fontSize === 'large') {
            root.style.fontSize = '20px'; // 125%
        } else if (fontSize === 'huge') {
            root.style.fontSize = '24px'; // 150%
        }

        // 2. Font Family
        if (fontFamily === 'serif') {
            root.style.setProperty('--font-sans', 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif');
            // We force override the tailwind default sans font stack variable if possible, 
            // or we add a global class. Adding a class is safer.
            document.body.classList.add('font-serif-mode');
            document.body.classList.remove('font-system-mode');
        } else {
            root.style.removeProperty('--font-sans');
            document.body.classList.add('font-system-mode');
            document.body.classList.remove('font-serif-mode');
        }

    }, [fontSize, fontFamily]);

    return (
        <AccessibilityContext.Provider value={{ fontSize, fontFamily, setFontSize, setFontFamily }}>
            {children}
            {/* Global Styles Injection for Font Modes */}
            <style>{`
                .font-serif-mode {
                    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
                }
                .font-system-mode {
                    /* Default Tailwind font stack */
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
                }
            `}</style>
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
