
import React from 'react';
import { DataMigrationTools } from '../components/DataMigrationTools';

const MigrationPage: React.FC = () => {
    return (
        <div style={{ padding: '40px', background: '#FDFBF7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="text-2xl font-bold mb-4">Migration Console</h1>
            <p className="mb-4 text-gray-600">This dedicated page ensures you can access the migration controls.</p>
            <DataMigrationTools />
            <div style={{ marginTop: '300px' }}>
                {/* Spacer to ensure the fixed tool has room if needed, though tool is fixed */}
            </div>
        </div>
    );
};

export default MigrationPage;
