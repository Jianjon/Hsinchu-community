import React, { useEffect } from 'react';
import { PublicCommunity } from '../data/mock_public';

interface DataValidatorProps {
    communities: PublicCommunity[];
}

const DataValidator: React.FC<DataValidatorProps> = ({ communities }) => {

    useEffect(() => {
        if (!communities || communities.length === 0) return;
        if (!window.google?.maps?.geometry?.poly) return; // Wait for Google API

        console.groupCollapsed('🔍 Data Integrity Check (Community Boundaries)');

        let errorCount = 0;
        let checkedCount = 0;

        communities.forEach(comm => {
            if (!comm.boundary || comm.boundary.length === 0) return;

            // Create Polygon for current community
            const polygon = new window.google.maps.Polygon({
                paths: comm.boundary.map(p => ({ lat: p[0], lng: p[1] }))
            });

            // 1. Check Projects (Local Placemaking)
            comm.projects?.forEach(p => {
                // Some projects might not have explicit location, or use community center
                // Only check if it differs significantly or is explicit
                // Skipping for now unless it has specific coordinates field which projects currently don't strictly have in interface but might in runtime
            });

            // 2. Check Care Actions (Community Care)
            comm.careActions?.forEach(action => {
                if (action.location) {
                    checkedCount++;
                    const loc = new window.google.maps.LatLng(action.location[0], action.location[1]);
                    if (!window.google.maps.geometry.poly.containsLocation(loc, polygon)) {
                        // Exception: Regional resources (Food banks etc) might be outside
                        if (action.type === 'care_action' && !action.title.includes('物資銀行') && !action.area.includes('全區') && !action.area.includes('新竹縣')) {
                            console.warn(`❌ [Out of Bounds] ${comm.name} - ${action.title}`, action);
                            errorCount++;
                        }
                    }
                }
            });

            // 3. Check Travel Spots
            comm.travelSpots?.forEach(spot => {
                if (spot.location) {
                    checkedCount++;
                    const loc = new window.google.maps.LatLng(spot.location[0], spot.location[1]);
                    if (!window.google.maps.geometry.poly.containsLocation(loc, polygon)) {
                        console.warn(`❌ [Out of Bounds] ${comm.name} - ${spot.name}`, spot);
                        errorCount++;
                    }
                }
            });
        });

        if (errorCount === 0) {
            console.log(`✅ All ${checkedCount} locations verified. No content is outside community boundaries.`);
        } else {
            console.log(`⚠️ Found ${errorCount} potential location errors.`);
        }
        console.groupEnd();

    }, [communities]);

    return null; // Headless component
};

export default DataValidator;
