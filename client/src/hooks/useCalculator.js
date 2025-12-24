import { useState, useEffect, useCallback } from 'react';
import { WOOD_DATA, WOOD_PRICES, IRON_DATA, CONCRETE_DATA } from '../utils/calculatorData';

const useCalculator = () => {
    // Unified Calculator State with Persistence
    const [calculatorParams, setCalculatorParams] = useState(() => {
        const saved = localStorage.getItem('calculatorParams');
        return saved ? JSON.parse(saved) : {
            sectionType: '1x1',
            tetes: '2',
            dalotLength: 0,
            puisard: '0'
        };
    });

    useEffect(() => {
        localStorage.setItem('calculatorParams', JSON.stringify(calculatorParams));
    }, [calculatorParams]);

    const calculateWood = useCallback(() => {
        const data = WOOD_DATA[calculatorParams.sectionType];
        if (!data) return {};

        const results = {
            lattes: 0,
            chevron: 0,
            planches: 0,
            panneaux: 0,
            madrier: 0,
            point80: 0,
            point60: 0,
            pointToc80: 0,
            totalPrice: 0
        };

        Object.keys(results).forEach(key => {
            if (key === 'totalPrice') return;

            const itemData = data[key];
            if (itemData) {
                results[key] = (itemData.ml * calculatorParams.dalotLength) +
                    (itemData.tete * parseInt(calculatorParams.tetes)) +
                    (itemData.puisard * parseInt(calculatorParams.puisard));

                results.totalPrice += results[key] * (WOOD_PRICES[key] || 0);
            }
        });

        return results;
    }, [calculatorParams]);


    const calculateIron = useCallback((diameter) => {
        const data = IRON_DATA[calculatorParams.sectionType]?.[diameter];
        if (!data) return 0;

        const total = (calculatorParams.dalotLength * data.ml) +
            (parseInt(calculatorParams.tetes) * data.tete) +
            (parseInt(calculatorParams.puisard) * data.puisard);

        // Format to max 2 decimal places if needed, or integer if it represents bars
        return Math.round(total * 100) / 100;
    }, [calculatorParams]);

    const calculateConcreteVolume = useCallback((part) => {
        const data = CONCRETE_DATA[calculatorParams.sectionType]?.[part];
        if (!data) return 0;

        const total = (calculatorParams.dalotLength * data.ml) +
            (parseInt(calculatorParams.tetes) * data.tete) +
            (parseInt(calculatorParams.puisard) * data.puisard);

        return Math.round(total * 1000) / 1000; // 3 decimal places for volume
    }, [calculatorParams]);

    const calculateTotalVolume = useCallback(() => {
        const parts = ['bp', 'radier', 'piedroit', 'dalle'];
        const total = parts.reduce((sum, part) => sum + calculateConcreteVolume(part), 0);
        return Math.round(total * 1000) / 1000;
    }, [calculateConcreteVolume]);

    const calculateBags = useCallback((part) => {
        const volume = calculateConcreteVolume(part);
        const rate = part === 'bp' ? 5 : 8;
        return Math.ceil(volume * rate);
    }, [calculateConcreteVolume]);

    const calculateTotalBags = useCallback(() => {
        // Calculate total volume for BP
        const bpVolume = calculateConcreteVolume('bp');
        const bpBags = Math.ceil(bpVolume * 5);

        // Calculate total volume for Reinforced Concrete (Radier + Piedroit + Dalle)
        const rcParts = ['radier', 'piedroit', 'dalle'];
        const rcVolume = rcParts.reduce((sum, part) => sum + calculateConcreteVolume(part), 0);
        const rcBags = Math.ceil(rcVolume * 8);

        return bpBags + rcBags;
    }, [calculateConcreteVolume]);

    return {
        calculatorParams,
        setCalculatorParams,
        calculateWood,
        calculateIron,
        calculateConcreteVolume,
        calculateTotalVolume,
        calculateBags,
        calculateTotalBags
    };
};

export default useCalculator;
