
// Simulate Mock
const mockWiki = {
    intro_history: "MOCK VALUE"
};
const comm = {
    wiki: mockWiki
};

// Simulate Firestore Persisted Data (with edited/migrated value)
const persisted = {
    introduction: "Persisted Intro",
    wiki: {
        intro_history: "PERSISTED (EDITED) VALUE"
    }
};

console.log("Before Merge:", comm.wiki.intro_history);

// CURRENT BROKEN LOGIC
const mergedWiki = {
    ...comm.wiki,
    ...persisted,
    wiki: undefined
};

console.log("After Merge (Current Logic):", mergedWiki.intro_history);

// PROPOSED FIX
const fixedWiki = {
    ...comm.wiki,
    ...persisted,
    ...(persisted.wiki || {}), // Merge nested wiki!
    wiki: undefined
};

console.log("After Merge (Proposed Fix):", fixedWiki.intro_history);
