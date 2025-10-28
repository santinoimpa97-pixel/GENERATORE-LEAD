import React from 'react';
import { KanbanColumn, Sector, Filters } from '../types';
import { SECTORS_OPTIONS } from '../constants';

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    columns: KanbanColumn[];
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, columns }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleReset = () => {
        setFilters({ searchTerm: '', statusId: 'all', sector: 'all', location: '' });
    };

    return (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                <input
                    type="text"
                    name="searchTerm"
                    placeholder="Cerca per nome, email..."
                    value={filters.searchTerm}
                    onChange={handleInputChange}
                    className="w-full p-2 pl-10 bg-transparent border border-input rounded-lg"
                />
            </div>
             <input
                type="text"
                name="location"
                placeholder="Filtra per località..."
                value={filters.location}
                onChange={handleInputChange}
                className="w-full p-2 bg-transparent border border-input rounded-lg"
            />
            <select
                name="statusId"
                value={filters.statusId}
                onChange={handleInputChange}
                className="w-full p-2 bg-transparent border border-input rounded-lg"
            >
                <option value="all">Tutti gli stati</option>
                {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
            </select>
            <select
                name="sector"
                value={filters.sector}
                onChange={handleInputChange}
                className="w-full p-2 bg-transparent border border-input rounded-lg"
            >
                <option value="all">Tutti i settori</option>
                {SECTORS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
             <button onClick={handleReset} className="w-full md:col-span-2 lg:col-span-1 text-muted-foreground hover:text-foreground p-2 rounded-lg border border-input" title="Resetta filtri">
                <i className="fas fa-undo mr-2"></i>Resetta
            </button>
        </div>
    );
};

export default FilterControls;