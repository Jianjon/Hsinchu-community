
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LocationData, AnalysisResult } from '../types';

/**
 * Export analysis results to an Excel file
 * @param data List of results containing location and analysis data
 * @param filename Output filename (default: analysis_report.xlsx)
 */
export const exportToExcel = (
    results: { location: LocationData, data: AnalysisResult }[],
    filename: string = `Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`
): void => {
    // Flatten the data for Excel table format
    const flatData = results.map(item => {
        const { location, data } = item;

        // Extract key metrics from markdown if possible, or just dump basic fields
        // Here we'll just put the full markdown in one cell for now, 
        // but ideally we'd parse specific fields if they were structured.
        // Since AnalysisResult is mostly markdown, we put it in "Report Content"

        return {
            "縣市": location.city,
            "行政區": location.district,
            "村里": location.village,
            "分析日期": new Date().toLocaleDateString(),
            "報告內容 (Markdown)": data.markdown,
            "建議事項": extractSection(data.markdown, "建議"), // Helper to extract if possible
            "人口數據": extractSection(data.markdown, "人口"),
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Village Analysis");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Save file
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, filename);
};

/**
 * Read village list from an Excel file
 * Expected columns: "縣市" (City), "行政區" (District), "村里" (Village)
 */
export const readVillageListFromExcel = async (file: File): Promise<LocationData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

                // Map to LocationData (flexible column matching)
                const locations: LocationData[] = [];
                rawData.forEach(row => {
                    const city = row['縣市'] || row['City'] || row['city'];
                    const district = row['行政區'] || row['District'] || row['district'];
                    const village = row['村里'] || row['Village'] || row['village'];

                    if (city && district && village) {
                        locations.push({
                            city: city.toString().trim(),
                            district: district.toString().trim(),
                            village: village.toString().trim()
                        });
                    }
                });

                resolve(locations);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Helper to extract basic sections from markdown roughly.
 * This is naive text parsing for demo purposes.
 */
function extractSection(markdown: string, keyword: string): string {
    const lines = markdown.split('\n');
    const sectionStart = lines.findIndex(l => l.includes(keyword) && l.startsWith('#'));
    if (sectionStart === -1) return "";

    let content = "";
    for (let i = sectionStart + 1; i < lines.length; i++) {
        if (lines[i].startsWith('#')) break; // Next section
        content += lines[i] + "\n";
    }
    return content.trim().substring(0, 500) + (content.length > 500 ? "..." : "");
}
