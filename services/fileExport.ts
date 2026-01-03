
import { LocationData, AnalysisResult, AuditCategory, AppStep } from "../types";

// ==========================================
// File Export Service for Village Data
// ==========================================

/**
 * Generate folder path for a village
 */
export const getVillageFolderPath = (location: LocationData): string => {
    return `data/${location.city}/${location.district}/${location.village}`;
};

/**
 * Get filename for each stage
 */
export const getStageFilename = (stage: AppStep): string => {
    switch (stage) {
        case AppStep.STEP_1_DRAFT:
            return "stage1_web_research.json";
        case AppStep.STEP_2_INTERVIEW:
            return "stage2_questionnaire.json";
        case AppStep.STEP_3_FINAL:
            return "stage3_final_report.json";
        default:
            return "unknown.json";
    }
};

// ==========================================
// Stage 1: Web Research Data
// ==========================================
export interface Stage1Data {
    location: LocationData;
    markdown: string;
    sources: Array<{ title: string; uri: string }>;
    createdAt: string;
}

export const createStage1Data = (
    location: LocationData,
    result: AnalysisResult
): Stage1Data => {
    return {
        location,
        markdown: result.markdown,
        sources: result.sources,
        createdAt: new Date().toISOString()
    };
};

// ==========================================
// Stage 2: Questionnaire Data
// ==========================================
export interface Stage2Data {
    location: LocationData;
    checklist: AuditCategory[];
    createdAt: string;
}

export const createStage2Data = (
    location: LocationData,
    checklist: AuditCategory[]
): Stage2Data => {
    return {
        location,
        checklist,
        createdAt: new Date().toISOString()
    };
};

// ==========================================
// Stage 3: Final Integrated Report
// ==========================================
export interface Stage3Data {
    location: LocationData;
    markdown: string;
    sources: Array<{ title: string; uri: string }>;
    checklist: AuditCategory[];
    transcript?: string;
    createdAt: string;
    updatedAt: string;
}

export const createStage3Data = (
    location: LocationData,
    result: AnalysisResult,
    transcript?: string
): Stage3Data => {
    const now = new Date().toISOString();
    return {
        location,
        markdown: result.markdown,
        sources: result.sources,
        checklist: result.checklist || [],
        transcript,
        createdAt: now,
        updatedAt: now
    };
};

// ==========================================
// Download Functions (Browser)
// ==========================================

/**
 * Download a single stage file
 */
export const downloadStageFile = (
    location: LocationData,
    stage: AppStep,
    data: Stage1Data | Stage2Data | Stage3Data
): void => {
    const filename = `${location.city}_${location.district}_${location.village}_${getStageFilename(stage)}`;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Download all stage files as a zip-like bundle (individual files)
 */
export const downloadAllStages = (
    location: LocationData,
    stage1?: Stage1Data,
    stage2?: Stage2Data,
    stage3?: Stage3Data
): void => {
    const prefix = `${location.city}_${location.district}_${location.village}`;

    if (stage1) {
        downloadStageFile(location, AppStep.STEP_1_DRAFT, stage1);
    }

    // Small delay between downloads
    setTimeout(() => {
        if (stage2) {
            downloadStageFile(location, AppStep.STEP_2_INTERVIEW, stage2);
        }
    }, 500);

    setTimeout(() => {
        if (stage3) {
            downloadStageFile(location, AppStep.STEP_3_FINAL, stage3);
        }
    }, 1000);
};

/**
 * Download as CMS-compatible Markdown with Frontmatter
 */
export const downloadAsCMSMarkdown = (
    location: LocationData,
    markdownContent: string,
    tags: string[] = ["社區發展"]
): void => {
    const filename = `${new Date().toISOString().split('T')[0]}-${location.village}.md`;

    const frontmatter = `---
title: "${location.village} (${location.city}${location.district})"
date: "${new Date().toISOString()}"
location:
  city: "${location.city}"
  district: "${location.district}"
  village: "${location.village}"
tags: ${JSON.stringify(tags)}
---

`;

    const fullContent = frontmatter + markdownContent;

    const blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Create a combined export with all data
 */
export interface VillageExportBundle {
    exportedAt: string;
    location: LocationData;
    folderPath: string;
    stages: {
        stage1?: Stage1Data;
        stage2?: Stage2Data;
        stage3?: Stage3Data;
    };
}

export const createExportBundle = (
    location: LocationData,
    stage1?: Stage1Data,
    stage2?: Stage2Data,
    stage3?: Stage3Data
): VillageExportBundle => {
    return {
        exportedAt: new Date().toISOString(),
        location,
        folderPath: getVillageFolderPath(location),
        stages: {
            stage1,
            stage2,
            stage3
        }
    };
};

export const downloadExportBundle = (bundle: VillageExportBundle): void => {
    const { location } = bundle;
    const filename = `${location.city}_${location.district}_${location.village}_complete_bundle.json`;
    const jsonString = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
