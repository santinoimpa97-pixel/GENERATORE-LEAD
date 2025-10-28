import React from 'react';
import ProfileSettings from './ProfileSettings';
import PasswordSettings from './PasswordSettings';

const SettingsView: React.FC = () => {
    return (
        <div className="flex-1 p-6 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-card-foreground">Impostazioni Account</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-card-foreground mb-4">Informazioni Profilo</h3>
                    <ProfileSettings />
                </div>
                 <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold text-card-foreground mb-4">Cambia Password</h3>
                    <PasswordSettings />
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
