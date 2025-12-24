
import { Lead, Sector } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    const validSectors = Object.values(Sector).join(', ');

    try {
        const response = await fetch('/api/generate-leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                count,
                existingLeads,
                sectors: validSectors
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Errore del server (${response.status})`);
        }

        const data = await response.json();
        return data.leads || [];

    } catch (error: any) {
        console.error("Service Error:", error);
        throw error;
    }
};
