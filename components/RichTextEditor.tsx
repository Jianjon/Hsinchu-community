import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
    ],
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, readOnly, className }) => {
    return (
        <div className={`rich-text-editor ${className || ''}`}>
            <style>{`
                .ql-editor {
                    min-height: 200px;
                    font-size: 16px;
                }
                .ql-container {
                    border-bottom-left-radius 0.5rem;
                    border-bottom-right-radius 0.5rem;
                }
                .ql-toolbar {
                    border-top-left-radius 0.5rem;
                    border-top-right-radius 0.5rem;
                }
            `}</style>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder}
                readOnly={readOnly}
                className="bg-white rounded-lg shadow-sm"
            />
        </div>
    );
};

export default RichTextEditor;
