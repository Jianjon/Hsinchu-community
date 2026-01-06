
import React, { useState } from 'react';
import { MOCK_COMMUNITIES } from '../data/mock_public';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { enrichCommunityData } from '../services/dataEnrichment';
import { useUser } from '../hooks/useUser';

export const DataMigrationTools: React.FC = () => {
    const { isLoggedIn, login } = useUser();
    const [status, setStatus] = useState<string>('Ready');
    const [progress, setProgress] = useState<string>('');

    // Helper to remove undefined fields recursively
    const sanitizeData = (data: any): any => {
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
            const newObj: any = {};
            for (const key in data) {
                if (data[key] !== undefined) {
                    newObj[key] = sanitizeData(data[key]);
                }
            }
            return newObj;
        }
        return data;
    };

    const handleMigrate = async () => {
        setStatus('Migrating...');

        // CRITICAL: Ensure we have the latest enriched data (Care Actions, etc.)
        enrichCommunityData(MOCK_COMMUNITIES);

        const db = getFirestore();
        let count = 0;
        let errors = 0;

        try {
            for (const community of MOCK_COMMUNITIES) {
                // Construct the Wiki Data based on Mock Data
                const rawData: any = {
                    name: community.name,
                    city: community.city,
                    district: community.district,
                    description: community.description,
                    tags: community.tags,
                    location: community.location,

                    // Arrays
                    projects: community.projects || [],
                    events: community.events || [],
                    people: community.people || [],
                    travelSpots: community.travelSpots || [],
                    communityBuildings: community.communityBuildings || [],
                    cultureHeritages: community.cultureHeritages || [],
                    careActions: community.careActions || [],

                    // Extended Wiki Fields
                    chief: community.chief,
                    population: community.population,
                    introduction: community.introduction,
                    facilities: community.facilities,
                    schools: community.schools,
                    ngos: community.ngos,
                    faithCenters: community.faithCenters,
                    resources: community.resources,
                    geography: community.geography,
                    type: community.type,

                    // Full Wiki Object if it exists
                    wiki: community.wiki,

                    // Metadata
                    lastMigratedAt: new Date().toISOString(),
                    isMigrated: true
                };

                const wikiData = sanitizeData(rawData);

                // ID construction
                const docId = community.id || `${community.city}_${community.district}_${community.name}`;

                await setDoc(doc(db, 'villages', docId), wikiData, { merge: true });

                count++;
                // Update progress with percentage
                const percent = Math.round((count / MOCK_COMMUNITIES.length) * 100);
                setProgress(`Migrated ${count}/${MOCK_COMMUNITIES.length} (${percent}%) - ${community.name}`);
            }
            setStatus(`Migration Completed! ${count} communities migrated.`);
            setProgress('Done (100%)');
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        }
    };

    const handleCheck = async () => {
        setStatus('Checking...');
        const db = getFirestore();
        try {
            // Check Beilun Li as it is known to have care actions in mock
            const docId = '新竹縣_竹北市_北崙里';
            const docRef = doc(db, 'villages', docId);
            const snap = await import('firebase/firestore').then(mod => mod.getDoc(docRef));

            if (snap.exists()) {
                const data = snap.data();
                const care = data.careActions?.length || 0;
                const events = data.events?.length || 0;
                const projects = data.projects?.length || 0;
                setStatus(`VERIFY RESULT: Found '北崙里'. CareActions: ${care}, Events: ${events}, Projects: ${projects}.`);
                console.log('Verification Data:', data);
            } else {
                setStatus('VERIFY RESULT: Document "新竹縣_竹北市_北崙里" NOT FOUND.');
            }
        } catch (e: any) {
            setStatus(`Check Error: ${e.message}`);
        }
    };

    const percent = progress.includes('%') ? parseInt(progress.split('(')[1]) : 0;

    if (!isLoggedIn) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'white',
                padding: '24px',
                border: '2px solid orange',
                zIndex: 9999,
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                width: '400px',
                maxWidth: '90vw',
                textAlign: 'center'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>⚠️ Login Required</h3>
                <p style={{ margin: '0 0 16px 0', color: '#666' }}>Current security rules require authentication to write data.</p>
                <button
                    onClick={() => login()}
                    style={{
                        padding: '10px 24px',
                        background: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Login / Sign Up
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            padding: '24px',
            border: '2px solid red',
            zIndex: 9999,
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            width: '400px',
            maxWidth: '90vw'
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>Data Migration Tool</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>Upload {MOCK_COMMUNITIES.length} Mock Communities to Firestore</p>

            {/* Status Box */}
            <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: status.startsWith('Error') ? '#FEF2F2' : '#F3F4F6',
                borderRadius: '6px',
                color: status.startsWith('Error') ? '#DC2626' : '#1F2937',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                maxHeight: '100px',
                overflowY: 'auto'
            }}>
                {status}
            </div>

            {/* Progress Bar */}
            {status === 'Migrating...' && (
                <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: '#EF4444', transition: 'width 0.2s' }} />
                </div>
            )}

            <div style={{ fontSize: '12px', color: 'gray', marginBottom: '16px', textAlign: 'right' }}>
                {progress}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={handleMigrate}
                    disabled={status === 'Migrating...'}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: status === 'Migrating...' ? '#9CA3AF' : '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: status === 'Migrating...' ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {status === 'Migrating...' ? 'Migrating...' : 'Start Migration'}
                </button>
                <button
                    onClick={handleCheck}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Verify Data
                </button>
            </div>
        </div>
    );
};
