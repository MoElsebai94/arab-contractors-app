import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import './DalotStatistics.css';

const DalotStatistics = ({ dalots = [], isRTL = false }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    const stats = useMemo(() => {
        // 1. Filter out cancelled dalots
        const activeDalots = dalots.filter(d => d.status !== 'cancelled');

        // 2. Group by dimension
        const dimensionGroups = {};

        activeDalots.forEach(d => {
            const dim = d.dimension || 'Unknown';
            if (!dimensionGroups[dim]) {
                dimensionGroups[dim] = {
                    name: dim,
                    total: 0,
                    finished: 0
                };
            }
            dimensionGroups[dim].total += 1;
            if (d.status === 'finished') {
                dimensionGroups[dim].finished += 1;
            }
        });

        // 3. Convert to array and sort by name
        return Object.values(dimensionGroups).sort((a, b) => a.name.localeCompare(b.name));
    }, [dalots]);

    if (stats.length === 0) return null;

    return (
        <div className="dalot-dimension-stats" dir={isRTL ? 'rtl' : 'ltr'}>
            <div
                className="stats-header"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer', marginBottom: isExpanded ? '1.5rem' : '0', borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none' }}
            >
                <div className="stats-title">
                    <BarChart3 size={20} className="text-blue-600" />
                    <span>{isRTL ? 'احصائيات الأبعاد' : 'Dimension Statistics'}</span>
                </div>
                {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
            </div>

            {isExpanded && (
                <div className="stats-grid">
                    {stats.map((stat) => {
                        const percentage = stat.total > 0 ? Math.round((stat.finished / stat.total) * 100) : 0;
                        const isComplete = percentage === 100;

                        return (
                            <div key={stat.name} className={`dimension-stat-card ${isComplete ? 'complete-card' : ''}`}>
                                <div className="dim-card-header">
                                    <span className="dim-name">{stat.name}</span>
                                    {isComplete && <CheckCircle2 size={16} className="text-green-500" />}
                                </div>

                                <div className="dim-progress-container">
                                    <div
                                        className={`dim-progress-bar ${isComplete ? 'complete' : ''}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <div className="dim-footer">
                                    <span className="dim-count">
                                        <span className={stat.finished > 0 ? 'finished' : ''}>{stat.finished}</span>
                                        <span className="separator">/</span>
                                        <span className="total">{stat.total}</span>
                                    </span>
                                    <span className="dim-percentage">{percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DalotStatistics;
