import React from 'react';
import { X } from 'lucide-react';
import { PublicEvent, PublicTravelSpot, PublicProject, CultureHeritage, CommunityBuilding } from '../data/mock_public';
import ItemDetailView from './ItemDetailView';
import WikiDashboardView from './WikiDashboardView';
// WIKI_DATA import removed

interface ItemDetailOverlayProps {
    item: {
        type: 'event' | 'travel' | 'project' | 'culture' | 'wiki' | 'facility' | 'care_action';
        data: any;
        communityName: string;
        district?: string;
    } | null;
    onClose: () => void;
    onNavigate?: (type: string, id: string) => void;
}

const ItemDetailOverlay: React.FC<ItemDetailOverlayProps> = ({ item, onClose, onNavigate }) => {
    if (!item) return null;

    // Build enriched wiki data if type is 'wiki'
    const getEnrichedWiki = () => {
        if (item.type !== 'wiki') return null;

        return {
            introduction: item.data?.introduction || "",
            population: item.data?.population || 0,
            area: item.data?.area || "N/A",
            type: item.data?.type || 'mixed',
            chief: {
                name: item.data?.chief?.name || "",
                phone: item.data?.chief?.phone || "",
                officeAddress: item.data?.chief?.officeAddress || "",
                officeHours: item.data?.chief?.officeHours || ""
            },
            association: item.data?.association || { chairman: "", contact: "", address: "" },
            facilities: item.data?.facilities || [],
            awards: item.data?.awards || [],
            features: item.data?.features || []
        };
    };

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4 md:p-8"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - absolute positioning on top of the view */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur-md"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex-1 h-full overflow-hidden flex flex-col">
                    {item.type === 'wiki' ? (
                        <WikiDashboardView
                            communityName={item.communityName}
                            district={item.district || ''}
                            wiki={getEnrichedWiki()!}
                            isEditMode={false}
                            onUpdate={() => { }}
                            onNavigateToItem={(t, id) => onNavigate?.(t, id)}
                            onAddItem={undefined}
                            onDeleteItem={undefined}
                        />
                    ) : (
                        <ItemDetailView
                            type={item.type as any}
                            data={item.data}
                            villageName={item.communityName}
                            onBack={undefined}
                            onClose={onClose}
                            onUpdate={() => { }}
                            isEditMode={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetailOverlay;

