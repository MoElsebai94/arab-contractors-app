import { useState, useEffect } from 'react';

const STORAGE_KEY = 'demande-achat-item-memory';

const useItemMemory = () => {
    const [savedItems, setSavedItems] = useState([]);

    useEffect(() => {
        // Load items from local storage on mount
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setSavedItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored items", e);
            }
        }
    }, []);

    const saveItems = (newItems) => {
        if (!newItems || newItems.length === 0) return;

        setSavedItems(prev => {
            // Extract descriptions, normalize (trim), and filter empty
            const newDescriptions = newItems
                .map(item => typeof item === 'string' ? item : item.designation)
                .filter(desc => desc && typeof desc === 'string' && desc.trim().length > 0)
                .map(desc => desc.trim());

            // Merge with previous items and remove duplicates
            const uniqueItems = [...new Set([...prev, ...newDescriptions])].sort();

            // Save to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueItems));

            return uniqueItems;
        });
    };

    return {
        savedItems,
        saveItems
    };
};

export default useItemMemory;
