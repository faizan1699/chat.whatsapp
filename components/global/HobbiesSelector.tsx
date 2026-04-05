'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { HOBBIES_APIS } from '@/libs/apis';
import { showCustomToast } from './CustomToast';
import DropdownArrow from '@/assets/svg/DropdownArrow';

interface Hobby {
    id: string;
    name: string;
}

interface HobbiesSelectorProps {
    selectedHobbies: string[];
    onHobbiesChange: (hobbyIds: string[]) => void;
    className?: string;
    sideClickClose?: boolean;
}

const HobbiesSelector = ({ 
    selectedHobbies,
    onHobbiesChange,
    className = '', 
    sideClickClose = true
}: HobbiesSelectorProps) => {

    const [hobbies, setHobbies] = useState<Hobby[]>([]);
    const [loading, setLoading] = useState(true);
    const [newHobbyName, setNewHobbyName] = useState('');
    const [addingHobby, setAddingHobby] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<Hobby[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside({
        ref: dropdownRef,
        handler: () => setShowDropdown(false),
        enabled: sideClickClose
    });

    useEffect(() => {
        fetchHobbies();
    }, []);

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            const filtered = hobbies.filter(hobby => {
                const matchesSearch = !query.trim() || hobby.name.toLowerCase().includes(query.toLowerCase());
                const notSelected = !selectedHobbies.includes(hobby.id);
                return matchesSearch && notSelected;
            });
            setSearchResults(filtered);
        }, 300),
        [hobbies, selectedHobbies]
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    const fetchHobbies = async () => {
        try {
            const response = await HOBBIES_APIS.getHobbies();
            setHobbies(response?.hobbies);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewHobby = async () => {
        if (!newHobbyName.trim() || selectedHobbies.length >= 15) return;

        setAddingHobby(true);
        try {
            const response = await HOBBIES_APIS.addHobby(newHobbyName.trim());

            const newHobby = response.data;
            setHobbies([...hobbies, newHobby]);
            setNewHobbyName('');

            const updatedSelection = [...selectedHobbies, newHobby.id];
            onHobbiesChange(updatedSelection);

            setSearchResults([]);
            setSearchTerm('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to add hobby');
        } finally {
            setAddingHobby(false);
        }
    };

    const handleAddFromSearch = async () => {
        if (!searchTerm.trim() || selectedHobbies.length >= 15) return;

        setAddingHobby(true);
        try {
            const response = await HOBBIES_APIS.addHobby(searchTerm.trim());

            const newHobby = response.data;
            setHobbies([...hobbies, newHobby]);

            const updatedSelection = [...selectedHobbies, newHobby.id];
            onHobbiesChange(updatedSelection);

            setSearchTerm('');
            setSearchResults([]);
        } catch (error: any) {
            console.error('Error adding hobby:', error);
            alert(error.response?.data?.error || 'Failed to add hobby');
        } finally {
            setAddingHobby(false);
        }
    };

    const handleHobbyToggle = (hobbyId: string) => {
        if (selectedHobbies.includes(hobbyId)) {
            const updatedSelection = selectedHobbies.filter(id => id !== hobbyId);
            onHobbiesChange(updatedSelection);
        } else if (selectedHobbies.length < 15) {
            const updatedSelection = [...selectedHobbies, hobbyId];
            onHobbiesChange(updatedSelection);
        } else {
            showCustomToast({
                message: 'Maximum 15 hobbies are allowed',
                type: 'warning',
                duration: 3000
            });
        }
    };

    const handleRemoveHobby = (hobbyId: string) => {
        const updatedSelection = selectedHobbies.filter(id => id !== hobbyId);
        onHobbiesChange(updatedSelection);
    };

    if (loading) {
        return (
            <div className={`space-y-3 ${className}`}>
                <label className="block text-sm font-medium text-gray-700">Hobbies</label>
                <div className="animate-pulse">
                 Loading ...
                </div>
            </div>
        );
    }

    const selectedHobbyObjects = hobbies.filter(hobby => selectedHobbies.includes(hobby.id));

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">Hobbies (Optional)</label>

            {selectedHobbyObjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedHobbyObjects.map((hobby) => (
                        <div
                            key={hobby.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                            <Tag size={14} />
                            <span>{hobby.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveHobby(hobby.id)}
                                className="ml-1 hover:text-green-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <div className="relative flex-1 group" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors text-left flex justify-between items-center"
                    >
                        <span className="text-gray-500">
                            {searchTerm || 'Search or select a hobby...'}
                        </span>
                        <DropdownArrow 
                            isOpen={showDropdown} 
                            className="text-gray-400" 
                        />
                    </button>

                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            {/* Search input */}
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search items"
                                autoComplete="off"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                autoFocus
                            />
                            
                            {/* Dropdown content */}
                            <div className="max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((hobby: Hobby, index) => {
                                        const isSelected = selectedHobbies.includes(hobby.id);
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    if (!isSelected && selectedHobbies.length < 15) {
                                                        handleHobbyToggle(hobby.id);
                                                        setSearchTerm('');
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between ${isSelected ? 'bg-green-50' : ''}`}
                                            >
                                                <span className="text-gray-900">{hobby.name}</span>
                                                {isSelected ? <Tag size={14} className="text-green-600" /> : <div className="w-4" />}
                                            </button>
                                        );
                                    })
                                ) : searchTerm.trim() && selectedHobbies.length < 15 ? (
                                    <div className="p-3">
                                        <p className="text-sm text-gray-500 mb-2">No hobbies found. Add "{searchTerm}" as a new hobby?</p>
                                        <button
                                            type="button"
                                            onClick={handleAddFromSearch}
                                            disabled={addingHobby}
                                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            {addingHobby ? 'Adding...' : `Add "${searchTerm}"`}
                                        </button>
                                    </div>
                                ) : searchTerm.trim() ? (
                                    <div className="p-3">
                                        <p className="text-sm text-gray-500">Maximum 15 hobbies reached. Remove some hobbies to add new ones.</p>
                                    </div>
                                ) : (
                                    <div className="p-3">
                                        <p className="text-sm text-gray-500">All available hobbies are already selected.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                Select your hobbies or add new ones. These will be visible on your profile. (Maximum 15 hobbies)
            </p>
        </div>
    );
}

export default HobbiesSelector