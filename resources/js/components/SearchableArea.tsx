// Create this file: /resources/js/components/SearchableArea.tsx

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

interface SearchableAreaDropdownProps {
    value: string;
    onChange: (value: string) => void;
    areas: string[];
    error?: string;
    placeholder?: string;
}

export default function SearchableAreaDropdown({
    value,
    onChange,
    areas,
    error,
    placeholder = "Select or type area..."
}: SearchableAreaDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter areas based on search term
    const filteredAreas = areas.filter(area =>
        area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setSearchTerm(inputValue);
        onChange(inputValue);
        setIsOpen(true);
    };

    const handleAreaSelect = (area: string) => {
        onChange(area);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        setSearchTerm(value);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? searchTerm : value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    className={`block w-full pl-9 pr-10 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        error ? 'border-red-300' : 'border-gray-300'
                    }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                        }`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* Show current input as "Add new" option if it doesn't exist */}
                    {searchTerm && !areas.includes(searchTerm) && (
                        <button
                            type="button"
                            onClick={() => handleAreaSelect(searchTerm)}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center text-blue-600 border-b border-gray-100"
                        >
                            <span className="mr-2">+</span>
                            Add "{searchTerm}" as new area
                        </button>
                    )}

                    {/* Existing areas */}
                    {filteredAreas.length > 0 ? (
                        filteredAreas.map((area, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleAreaSelect(area)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                            >
                                <MapPin className="h-3 w-3 text-gray-400 mr-2" />
                                {area}
                            </button>
                        ))
                    ) : searchTerm ? null : (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                            No areas found. Type to add a new area.
                        </div>
                    )}

                    {/* Show all areas when no search term */}
                    {!searchTerm && areas.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                            No areas available yet.
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
