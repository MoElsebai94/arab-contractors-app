import { useState } from 'react';
import { Plus, Trash2, Scissors, Calculator } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const IronCutter = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ quantity: 1, length: '', diameter: '10' });
    const [results, setResults] = useState(null);

    const diameters = ['6', '8', '10', '12', '14', '16', '20', '25', '32'];

    const handleAddItem = () => {
        if (!newItem.length || newItem.length <= 0) return;
        if (parseFloat(newItem.length) > 12) {
            alert(t('barLengthTrigger'));
            return;
        }

        const itemToAdd = {
            id: Date.now(),
            quantity: parseInt(newItem.quantity) || 1,
            length: parseFloat(newItem.length),
            diameter: newItem.diameter
        };

        setItems([...items, itemToAdd]);
        setNewItem({ ...newItem, length: '' }); // Reset length but keep diameter
        setResults(null); // Clear previous results
    };

    const handleDeleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
        setResults(null);
    };

    const optimizeCuts = () => {
        if (items.length === 0) return;

        // Group items by diameter
        const stockLength = 12;
        const groupedItems = {};

        items.forEach(item => {
            if (!groupedItems[item.diameter]) {
                groupedItems[item.diameter] = [];
            }
            // Expand quantity into individual pieces for the algorithm
            for (let i = 0; i < item.quantity; i++) {
                groupedItems[item.diameter].push(item.length);
            }
        });

        const optimizationResults = {};

        Object.keys(groupedItems).forEach(diameter => {
            // Sort pieces descending (Best Fit Decreasing)
            const pieces = groupedItems[diameter].sort((a, b) => b - a);
            const bars = []; // Array of { remaining: number, cuts: number[] }

            pieces.forEach(piece => {
                // Find best fit: tightest spot it fits into
                let bestBarIndex = -1;
                let minRemaining = stockLength + 1;

                for (let i = 0; i < bars.length; i++) {
                    if (bars[i].remaining >= piece) {
                        const remainingAfter = bars[i].remaining - piece;
                        if (remainingAfter < minRemaining) {
                            minRemaining = remainingAfter;
                            bestBarIndex = i;
                        }
                    }
                }

                if (bestBarIndex !== -1) {
                    bars[bestBarIndex].cuts.push(piece);
                    bars[bestBarIndex].remaining -= piece;
                } else {
                    // Start new bar
                    bars.push({
                        remaining: stockLength - piece,
                        cuts: [piece]
                    });
                }
            });

            // Group identical patterns
            const groupedPatterns = [];
            bars.forEach(bar => {
                // Sort cuts for consistent key generation
                bar.cuts.sort((a, b) => b - a);
                const key = bar.cuts.join(',');

                const existingGroup = groupedPatterns.find(g => g.key === key);
                if (existingGroup) {
                    existingGroup.count++;
                } else {
                    groupedPatterns.push({
                        ...bar,
                        key,
                        count: 1
                    });
                }
            });

            optimizationResults[diameter] = {
                totalBars: bars.length,
                patterns: groupedPatterns,
                totalWaste: bars.reduce((acc, bar) => acc + bar.remaining, 0),
                wastePercentage: ((bars.reduce((acc, bar) => acc + bar.remaining, 0) / (bars.length * stockLength)) * 100).toFixed(1)
            };
        });

        setResults(optimizationResults);
    };

    return (
        <div className="iron-cutter-container">
            <div className="input-section">
                <h3>{t('ironCutter')}</h3>

                <div className="add-item-form">
                    <div className="form-group">
                        <label>{t('diameter')}</label>
                        <select
                            value={newItem.diameter}
                            onChange={(e) => setNewItem({ ...newItem, diameter: e.target.value })}
                        >
                            {diameters.map(d => (
                                <option key={d} value={d}>Φ{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('lengthMeter')}</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="12"
                            value={newItem.length}
                            onChange={(e) => setNewItem({ ...newItem, length: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder="e.g. 5.5"
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('quantity')}</label>
                        <input
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                    </div>

                    <button className="add-btn" onClick={handleAddItem}>
                        <Plus size={20} />
                        {t('addBar')}
                    </button>
                </div>
            </div>

            {items.length > 0 && (
                <div className="items-list">
                    {items.map(item => (
                        <div key={item.id} className="item-chip">
                            <span>{item.quantity}x Φ{item.diameter} L={item.length}m</span>
                            <button onClick={() => handleDeleteItem(item.id)} className="delete-chip-btn">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button className="optimize-btn" onClick={optimizeCuts}>
                        <Calculator size={18} />
                        {t('optimize')}
                    </button>
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h3>{t('results')}</h3>
                    {Object.keys(results).map(diameter => (
                        <div key={diameter} className="diameter-result">
                            <div className="result-header">
                                <span className="diameter-badge">Φ{diameter}</span>
                                <div className="result-stats">
                                    <span>{t('totalBars12m')}: <strong>{results[diameter].totalBars}</strong></span>
                                    <span>{t('waste')}: <strong>{results[diameter].wastePercentage}%</strong> ({results[diameter].totalWaste.toFixed(2)}m)</span>
                                </div>
                            </div>

                            <div className="patterns-list">
                                {results[diameter].patterns.map((group, idx) => (
                                    <div key={idx} className="bar-visual">
                                        <div className="bar-label">
                                            <div>{t('cutPattern')} #{idx + 1}</div>
                                            <div className="bar-count-badge">x{group.count}</div>
                                        </div>
                                        <div className="bar-track">
                                            {(() => {
                                                let cumulative = 0;
                                                return group.cuts.map((cut, cIdx) => {
                                                    cumulative += cut;
                                                    // Floating point correction for display
                                                    const displayCumulative = Number(cumulative.toFixed(2));

                                                    return (
                                                        <div
                                                            key={cIdx}
                                                            className="cut-segment"
                                                            style={{ width: `${(cut / 12) * 100}%` }}
                                                            title={`${cut}m (x${group.count})`}
                                                        >
                                                            <span className="segment-text">
                                                                {cut}m <span className="segment-qty">x{group.count}</span>
                                                            </span>
                                                            {cIdx < group.cuts.length && (
                                                                <div className="cumulative-marker">
                                                                    <div className="marker-line"></div>
                                                                    <div className="marker-value">{displayCumulative}m</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            <div
                                                className="waste-segment"
                                                style={{ width: `${(group.remaining / 12) * 100}%` }}
                                                title={`Waste: ${group.remaining.toFixed(2)}m`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .iron-cutter-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .input-section {
                    background: var(--bg-secondary);
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }

                .add-item-form {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    align-items: end;
                    margin-top: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .form-group select,
                .form-group input {
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    font-size: 0.95rem;
                    background: white;
                }

                .add-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: background 0.2s;
                    height: 42px;
                }

                .add-btn:hover {
                    background: var(--primary-hover);
                }

                .items-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: white;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    align-items: center;
                }

                .item-chip {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-secondary);
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border: 1px solid var(--border);
                }

                .delete-chip-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 2px;
                    border-radius: 50%;
                }

                .delete-chip-btn:hover {
                    background: #fee2e2;
                }

                .optimize-btn {
                    margin-left: auto;
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
                    transition: all 0.2s;
                }

                .optimize-btn:hover {
                    background: #059669;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px -1px rgba(16, 185, 129, 0.3);
                }

                .results-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .diameter-result {
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                }

                .result-header {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border);
                }

                .diameter-badge {
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .result-stats {
                    display: flex;
                    gap: 1.5rem;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .result-stats strong {
                    color: var(--text-main);
                }

                .patterns-list {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .bar-visual {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bar-label {
                    width: 70px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .bar-count-badge {
                    background: var(--text-main);
                    color: white;
                    border-radius: 12px;
                    padding: 0.1rem 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    align-self: flex-start;
                }

                .cut-segment {
                    height: 100%;
                    background: #3b82f6;
                    border-right: 1px solid rgba(255,255,255,0.5);
                    color: white;
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: visible;
                    padding: 0 4px;
                    position: relative;
                    min-width: 0; /* Critical for accurate flex sizing */
                }

                .segment-text {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .segment-qty {
                    background: rgba(255,255,255,0.2);
                    padding: 0 4px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }

                .cumulative-marker {
                    position: absolute;
                    right: 0;
                    bottom: -22px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 10;
                    transform: translateX(50%); /* Centers the marker on the cut line */
                }

                .marker-line {
                    width: 1px;
                    height: 6px;
                    background: #666;
                    margin-bottom: 2px;
                }

                .marker-value {
                    font-size: 0.7rem;
                    color: #4b5563;
                    font-weight: 600;
                    background: white;
                    padding: 0 2px;
                    line-height: 1;
                }

                .bar-track {
                    flex: 1;
                    height: 32px;
                    background: #eee;
                    border-radius: 4px;
                    display: flex;
                    overflow: visible;
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .waste-segment {
                    height: 100%;
                    background: #ef4444;
                    opacity: 0.3;
                    background-image: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        #ffffff 5px,
                        #ffffff 10px
                    );
                }
            `}</style>
        </div>
    );
};

export default IronCutter;
