
// Mock Data for New Guo Li (extracted from grep)
const mockWiki = {
    introduction: "New Guo Li Intro",
    intro_history: "New Guo Li History: Early days..."
};

const mockCommunity = {
    id: "Hsinchu_Zhubei_NewGuoLi",
    name: "新國里",
    district: "竹北市",
    wiki: mockWiki,
    introduction: "Top level intro"
};

// Simulated Firestore Data (as saved by DataMigrationTools)
const firestoreData = {
    name: "新國里",
    wiki: mockWiki, // Nested wiki
    introduction: "Top level intro"
};

// Simulated publicDataAdaptor logic
function adapt() {
    // 1. Base initialization from Mock
    let comm = {
        id: mockCommunity.id,
        wiki: undefined as any
    };

    // 2. Mock Merge
    if (mockCommunity.wiki) {
        comm.wiki = {
            ...mockCommunity.wiki,
            facilities: []
        };
    }

    console.log("After Mock Merge:", JSON.stringify(comm.wiki, null, 2));

    // 3. Firestore Merge
    const persisted = firestoreData;
    if (persisted.introduction || (persisted as any).facilities) {
        console.log("Merging Firestore...");
        comm.wiki = {
            ...comm.wiki,
            ...persisted,
            wiki: undefined
        }
    }

    console.log("Final Wiki:", JSON.stringify(comm.wiki, null, 2));

    if (comm.wiki.intro_history) {
        console.log("SUCCESS: intro_history present");
    } else {
        console.log("FAILURE: intro_history MISSING");
    }
}

adapt();
