import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image as ImageIcon, Upload, Loader2, X, Move, ZoomIn, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useUser } from '../hooks/useUser';

interface ImageUploaderProps {
    value?: string;
    onChange: (imageData: string | null) => void;
    placeholder?: string;
    className?: string;
    height?: string;
    allowAdjustment?: boolean;
    imagePosition?: { x: number; y: number };
    imageScale?: number;
    onAdjustmentChange?: (position: { x: number; y: number }, scale: number) => void;
    accept?: string; // e.g. "image/*,video/*"
    maxSize?: number; // In bytes
    userId?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    onChange,
    placeholder = "拖放圖片或點擊上傳",
    className = "",
    height = "h-40",
    allowAdjustment = false,
    imagePosition = { x: 50, y: 50 },
    imageScale = 1,
    onAdjustmentChange,
    accept = "image/*",
    maxSize = 5 * 1024 * 1024, // Default 5MB
    userId: propUserId
}) => {
    const { user } = useUser();
    const userId = propUserId || user?.id || 'anonymous';
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Added for feedback
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleFileChange = useCallback((file: File | null) => {
        if (!file) return;

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            alert('請選擇圖片或影片檔案');
            return;
        }

        // Validate file size
        const limitSize = isVideo ? 10 * 1024 * 1024 : maxSize; // Videos fixed at 10MB for now
        if (file.size > limitSize) {
            alert(`檔案大小不能超過 ${Math.round(limitSize / (1024 * 1024))}MB`);
            return;
        }

        setIsLoading(true);

        if (isVideo) {
            // For video, we just read as data URL and upload (base64)
            // In a real app, this would go to a storage bucket
            const reader = new FileReader();
            reader.onload = (e) => {
                onChange(e.target?.result as string);
                setIsLoading(false);
            };
            reader.onerror = () => {
                alert('影片載入失敗');
                setIsLoading(false);
            };
            reader.readAsDataURL(file);
            return;
        }

        // Create image element for resizing
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = async () => {
            // Resize image if too large
            const maxWidth = 1200;
            const maxHeight = 800;
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            // Draw to canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Convert to base64 with compression
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            try {
                // Upload to Firebase Storage
                const path = storageService.generatePath(userId, file.name);
                const downloadUrl = await storageService.uploadBase64(compressedDataUrl, path);
                onChange(downloadUrl);
            } catch (error) {
                console.error("Upload failed:", error);
                alert("上傳至雲端失敗，請稍後再試");
            } finally {
                setIsLoading(false);
            }
        };

        img.onerror = () => {
            alert('圖片載入失敗');
            setIsLoading(false);
        };

        reader.readAsDataURL(file);
    }, [onChange, maxSize, userId]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileChange(file);
    }, [handleFileChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    // --- Image Adjustment Logic ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!allowAdjustment || !value) return;
        e.preventDefault(); // Prevent default drag behavior
        setIsAdjusting(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isAdjusting || !allowAdjustment || !dragStartRef.current || !onAdjustmentChange || !containerRef.current) return;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        // Convert pixel delta to percentage
        // Reversing direction to make it feel like "dragging the image"
        // If I drag right, image moves right -> object-position x decreases (moves focus left) ??
        // Standard object-position: 50% 50%.
        // 0% is Left edge of image aligned with left edge of container.
        // 100% is Right edge of image aligned with right edge of container.
        // If I want to move image RIGHT within the container, I need to DECREASE the percentage?
        // Let's think: 0% shows the left part. 100% shows the right part.
        // If I drag mouse RIGHT, I expect the image to move RIGHT.
        // To move image RIGHT, we need to show the LEFT part eventually? No.
        // If the viewport is static.
        // Let's implement direct mapping and test.
        // Typically: Dragging right -> moves content right.

        const rect = containerRef.current.getBoundingClientRect();
        const percentX = -(deltaX / rect.width) * 100; // Negative to move image with mouse
        const percentY = -(deltaY / rect.height) * 100;

        const newX = Math.min(100, Math.max(0, imagePosition.x + percentX));
        const newY = Math.min(100, Math.max(0, imagePosition.y + percentY));

        // Update drag start to current position to avoid compounding jumps
        // But here we need continuous updates.
        // Better: Calculate total delta from start, but we updated state?
        // Let's just use small increments.

        onAdjustmentChange({
            x: Math.min(100, Math.max(0, imagePosition.x - (deltaX / rect.width * 100))),
            y: Math.min(100, Math.max(0, imagePosition.y - (deltaY / rect.height * 100)))
        }, imageScale);

        dragStartRef.current = { x: e.clientX, y: e.clientY };

    }, [isAdjusting, allowAdjustment, imagePosition, imageScale, onAdjustmentChange]);

    const handleMouseUp = useCallback(() => {
        setIsAdjusting(false);
        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (isAdjusting) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isAdjusting, handleMouseMove, handleMouseUp]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!allowAdjustment || !value || !onAdjustmentChange) return;
        // Don't prevent default if not hovering the image container specifically? 
        // Actually, we are on the container.

        const zoomStep = 0.1;
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        const newScale = Math.min(3, Math.max(1, imageScale + delta));

        onAdjustmentChange(imagePosition, newScale);
    }, [allowAdjustment, value, imageScale, imagePosition, onAdjustmentChange]);


    return (
        <div className={className}>
            <div
                ref={containerRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onMouseDown={handleMouseDown} // For positioning
                onWheel={handleWheel} // For zooming
                className={`relative w-full ${height} rounded-xl overflow-hidden group transition-all
                    ${!value ? 'cursor-pointer' : allowAdjustment ? 'cursor-move' : ''}
                    ${isDragging ? 'scale-[1.02] border-2 border-dashed border-[#8DAA91]' : ''}`}
                style={{
                    backgroundColor: isDragging ? 'rgba(141,170,145,0.15)' : 'rgba(141,170,145,0.05)',
                    border: !value && !isDragging ? '2px dashed rgba(141,170,145,0.3)' : undefined
                }}
                onClick={(e) => {
                    if (!value) fileInputRef.current?.click();
                }}
            >
                {value ? (
                    <>
                        {value.startsWith('data:video') || value.startsWith('blob:video') || value.includes('.mp4') || value.includes('.mov') ? (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                <video
                                    src={value}
                                    className="max-w-full max-h-full"
                                    controls
                                    muted
                                    playsInline
                                />
                            </div>
                        ) : (
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-full object-cover transition-transform duration-75"
                                style={{
                                    objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                    transform: `scale(${imageScale})`
                                }}
                            />
                        )}

                        {/* Overlay Controls */}
                        <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center pointer-events-none 
                            ${isAdjusting ? 'opacity-0' : allowAdjustment ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

                            {!isAdjusting && (
                                <>
                                    <div className="flex items-center gap-4 mb-4 pointer-events-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm text-sm font-bold flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" /> 更換
                                        </button>
                                        <button
                                            onClick={handleClear}
                                            className="px-3 py-1.5 bg-red-500/50 hover:bg-red-500/70 text-white rounded-lg backdrop-blur-sm text-sm font-bold flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> 移除
                                        </button>
                                    </div>

                                    {allowAdjustment && (
                                        <div className="w-56 bg-black/60 backdrop-blur-md p-4 rounded-xl pointer-events-auto mt-2 border border-white/10 shadow-xl" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between text-white mb-3">
                                                <div className="flex items-center gap-2">
                                                    <ZoomIn className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-xs font-bold tracking-wide">縮放</span>
                                                </div>
                                                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{Math.round(imageScale * 100)}%</span>
                                            </div>

                                            <div className="relative flex items-center h-6">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="3"
                                                    step="0.1"
                                                    value={imageScale}
                                                    onChange={(e) => {
                                                        onAdjustmentChange?.(imagePosition, parseFloat(e.target.value));
                                                    }}
                                                    className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-colors z-20 relative"
                                                />
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/70 justify-center">
                                                <Move className="w-3 h-3" />
                                                <span>拖曳圖片可調整位置</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#8DAA91' }} />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <Upload className="w-8 h-8" style={{ color: '#8DAA91' }} />
                        <span className="text-sm font-bold" style={{ color: '#8B8B8B' }}>
                            {placeholder}
                        </span>
                        <span className="text-xs" style={{ color: '#AAAAAA' }}>
                            支援 JPG、PNG，最大 5MB
                        </span>
                    </div>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
        </div>
    );
};

export default ImageUploader;
