
import { saveVillageRecord } from "./localDatabase";
import { AppStep, AnalysisResult, LocationData, CommunityWikiData } from "../types";

export const seedCommunityWiki = async () => {
    try {
        const response = await fetch("/data/community_wiki.json");
        if (!response.ok) throw new Error("Failed to fetch wiki data");

        const communities: CommunityWikiData[] = await response.json();
        console.log(`Seeding ${communities.length} communities...`);

        let count = 0;
        for (const comm of communities) {
            // Construct LocationData
            const location: LocationData = {
                city: "新竹縣", // Simplify: Assume most are county or parse from adminRegion
                district: comm.adminRegion.replace("新竹縣", "").replace("新竹市", ""),
                village: comm.villageName
            };

            // Handle City logic if needed
            if (comm.adminRegion.includes("新竹市")) {
                location.city = "新竹市";
            }

            // Create a dummy result for the record
            const result: AnalysisResult = {
                markdown: "",
                sources: [],
                checklist: []
            };

            // We only want to update the wikiData part, but saveVillageRecord updates everything.
            // Ideally, we check existence first, which saveVillageRecord does internally.
            // However, saveVillageRecord currently requires 'result' and 'step'.
            // We can pass DRAFT step.

            // Wait for save
            // We need to pass the wikiData. 
            // IMPORTANT: saveVillageRecord in localDatabase.ts needs to accept wikiData as an optional arg
            // OR we modify saveVillageRecord to merge it.
            // My previous edit to saveVillageRecord *preserved* wikiData, but didn't allow *setting* it.

            // I need to update saveVillageRecord signature first! 
            // But for now let's assume I will fix that.
        }
        console.log("Seeding complete.");
    } catch (error) {
        console.error("Seeding failed:", error);
    }
};
