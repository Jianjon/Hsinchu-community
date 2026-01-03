import React from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface MultiImageUploaderProps {
    values: string[];
    onChange: (newValues: string[]) => void;
    maxImages?: number;
    className?: string;
    height?: string;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
    values = [],
    onChange,
    maxImages = 4,
    className = "",
    height = "h-32"
}) => {
    const handleAdd = (imageData: string | null) => {
        if (imageData && values.length < maxImages) {
            onChange([...values, imageData]);
        }
    };

    const handleUpdate = (index: number, imageData: string | null) => {
        if (imageData === null) {
            const newValues = values.filter((_, i) => i !== index);
            onChange(newValues);
        } else {
            const newValues = [...values];
            newValues[index] = imageData;
            onChange(newValues);
        }
    };

    const handleRemove = (index: number) => {
        const newValues = values.filter((_, i) => i !== index);
        onChange(newValues);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {values.map((url, index) => (
                    <div key={index} className="relative group">
                        <ImageUploader
                            value={url}
                            onChange={(data) => handleUpdate(index, data)}
                            height={height}
                            className="w-full"
                        />
                    </div>
                ))}

                {values.length < maxImages && (
                    <div className={`relative ${height} rounded-xl border-2 border-dashed border-[#8DAA91]/30 hover:border-[#8DAA91]/60 bg-[#8DAA91]/5 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden`}>
                        <ImageUploader
                            onChange={handleAdd}
                            height={height}
                            placeholder="新增照片"
                            className="w-full h-full opacity-0 absolute inset-0 z-10"
                        />
                        <Plus className="w-8 h-8 text-[#8DAA91]" />
                        <span className="text-xs font-bold text-[#8DAA91]">新增照片</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <ImageIcon className="w-3 h-3" />
                <span>最多可上傳 {maxImages} 張照片</span>
            </div>
        </div>
    );
};

export default MultiImageUploader;
