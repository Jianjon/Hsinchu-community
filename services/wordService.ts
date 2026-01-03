
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { LocationData, AnalysisResult } from '../types';

/**
 * Export a single analysis report to Word (.docx)
 */
export const exportToWord = async (
    location: LocationData,
    result: AnalysisResult
): Promise<void> => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    text: `${location.city}${location.district}${location.village} - 社區發展分析報告`,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),

                // Metadata
                new Paragraph({
                    children: [
                        new TextRun({ text: "分析日期: ", bold: true }),
                        new TextRun(new Date().toLocaleDateString()),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "資料來源: ", bold: true }),
                        new TextRun("Taiwan Village Analyst (AI Powered)"),
                    ],
                    spacing: { after: 400 },
                }),

                // Content - Convert Markdown to Docx Paragraphs
                ...convertMarkdownToDocx(result.markdown)
            ],
        }],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${location.village}_分析報告.docx`);
};

/**
 * Simple Markdown to Docx converter
 * Supports: Headers (#, ##), Lists (-), Bold (**), and plain text.
 */
function convertMarkdownToDocx(markdown: string): Paragraph[] {
    const lines = markdown.split('\n');
    const paragraphs: Paragraph[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return; // Skip empty lines

        // Headers
        if (trimmed.startsWith('# ')) {
            paragraphs.push(new Paragraph({
                text: trimmed.replace('# ', ''),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 },
            }));
        } else if (trimmed.startsWith('## ')) {
            paragraphs.push(new Paragraph({
                text: trimmed.replace('## ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            }));
        } else if (trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
                text: trimmed.replace('### ', ''),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 160, after: 80 },
            }));

            // List Items
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            paragraphs.push(new Paragraph({
                children: parseTextFormatting(content),
                bullet: { level: 0 }
            }));

            // Normal Text
        } else {
            paragraphs.push(new Paragraph({
                children: parseTextFormatting(trimmed),
                spacing: { after: 120 },
            }));
        }
    });

    return paragraphs;
}

/**
 * Parse **bold** text within a string
 */
function parseTextFormatting(text: string): TextRun[] {
    const parts = text.split(/(\*\*.*?\*\*)/g); // Split by bold markers

    return parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({
                text: part.slice(2, -2),
                bold: true
            });
        }
        return new TextRun({ text: part });
    });
}
