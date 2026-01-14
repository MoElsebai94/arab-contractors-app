import React, { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, Map } from 'lucide-react';
import './DalotSchematic.css';

// Helper to parse PK string "KK+MMM" -> meters
const parsePK = (pkStr) => {
    if (!pkStr) return 0;
    try {
        const parts = pkStr.split('+');
        if (parts.length !== 2) return 0;
        const k = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return (k * 1000) + m;
    } catch (e) {
        return 0;
    }
};

// Helper to format meters -> "KK+MMM"
const formatPK = (meters) => {
    const k = Math.floor(meters / 1000);
    const m = Math.floor(meters % 1000);
    return `${k.toString().padStart(2, '0')}+${m.toString().padStart(3, '0')}`;
};

const DalotSchematic = ({ dalots = [], topology = [], isRTL = false }) => {
    const [pixelsPerMeter, setPixelsPerMeter] = useState(0.2); // Default zoom level
    const [hoveredDalot, setHoveredDalot] = useState(null);
    const [selectedDalot, setSelectedDalot] = useState(null); // For touch devices
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef(null);
    const viewportRef = useRef(null);

    // Detect mobile/touch device
    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches ||
                'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'finished': return '#10b981';
            case 'in_progress': return '#3b82f6';
            case 'cancelled': return '#ef4444';
            case 'pending': return '#94a3b8';
            default: return '#cbd5e1';
        }
    };

    // Format status for display (e.g., "in_progress" -> "In Progress")
    const formatStatus = (status) => {
        if (!status) return '';
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // 1. Process Geometry
    const geometry = useMemo(() => {
        if (!Array.isArray(topology) || topology.length === 0) return { width: 800, height: 400, sections: [] };

        // Constants
        const ROW_HEIGHT = 100;
        const BASE_Y = 150;
        const BUFFER_X = 50;
        const MIN_SECTION_LENGTH = 5000; // Minimum visible length (5km) for sections with no/zero data

        // Map section ID to geometry info
        const sectionGeo = {};

        // First pass: Calculate visual start/end for each section
        // We assume the main trunk (row 0) defines the primary X axis.
        // Branch sections (row > 0) start at their parent's PK location.

        // Find global start PK to normalize X=0
        // We find the minimum startPK among all Main or Continuous sections to be our "Visual Zero"
        // If there are no such sections, just use 0.
        // This prevents huge empty whitespace if the project starts at PK 50+000
        const mainSections = topology.filter(s => s.type === 'main' || s.type === 'continuous');
        const startPKs = mainSections.map(s => Number(s.startPK) || 0);
        const globalStartPK = startPKs.length > 0 ? Math.min(...startPKs) : 0;

        // Track how many sections are at each row to handle stacking
        const rowCounts = {};

        topology.forEach(section => {
            // Ensure we have valid numeric values
            const sectionStartPK = Number(section.startPK) || 0;
            const sectionEndPK = Number(section.endPK) || 0;
            const sectionBranchPK = Number(section.branchPK) || 0;

            // Calculate length with minimum to prevent zero-width sections
            let length = sectionEndPK - sectionStartPK;
            if (length <= 0) {
                length = MIN_SECTION_LENGTH; // Use minimum length for empty/invalid sections
            }

            // Determine Y position based on section type
            // Main and Continuous sections share the same Y (row 0 typically) - they form one line
            // Branch sections MUST be on row 1+ to appear below the main line
            let row = section.row || 0;
            let y;

            if (section.type === 'main' || section.type === 'continuous') {
                // Main line sections all go on the same Y - no stacking
                y = BASE_Y + (row * ROW_HEIGHT);
            } else {
                // Branch sections - FORCE to at least row 1 if on row 0
                if (row === 0) {
                    row = 1;  // Branches must be below the main line
                }
                // Track stacking on the same row for multiple branches
                if (!rowCounts[row]) {
                    rowCounts[row] = 0;
                }
                const rowOffset = rowCounts[row] * 40; // Y offset if multiple branches on same row
                rowCounts[row]++;
                y = BASE_Y + (row * ROW_HEIGHT) + rowOffset;
            }

            let startX = 0;

            if (section.type === 'main') {
                startX = (sectionStartPK - globalStartPK);
            } else if (section.type === 'continuous') {
                // Continuous continues from global flow - uses its own startPK
                startX = (sectionStartPK - globalStartPK);
            } else if (section.type === 'branch') {
                // Branch starts at specific PK of parent
                // Parent ID: section.fromSection
                // Branching Point: section.branchPK
                // Visual Start X = (branchPK - globalStartPK)
                startX = (sectionBranchPK - globalStartPK);
            }

            // Ensure startX is not negative
            if (startX < 0) startX = 0;

            sectionGeo[section.id] = {
                ...section,
                startPK: sectionStartPK,
                endPK: sectionEndPK,
                length,
                visualStartX: startX,
                visualEndX: startX + length,
                y,
                // Use consistent color for all lines (branches same as main)
                color: section.color || '#94a3b8'
            };
        });

        // Convert to pixels
        const sections = Object.values(sectionGeo).map(s => ({
            ...s,
            pxStart: s.visualStartX * pixelsPerMeter + BUFFER_X,
            pxEnd: s.visualEndX * pixelsPerMeter + BUFFER_X,
            pxLen: s.length * pixelsPerMeter
        }));

        // Calculate total canvas dimensions
        // Add extra padding on the right for branches (curveForward) plus scroll room
        const EXTRA_RIGHT_PADDING = 150;
        const maxX = sections.length > 0 ? Math.max(...sections.map(s => s.pxEnd)) : 800;
        const maxY = sections.length > 0 ? Math.max(...sections.map(s => s.y)) : 400;

        return {
            width: maxX + EXTRA_RIGHT_PADDING,
            height: maxY + 100,
            sections,
            sectionGeo,
            bufferX: BUFFER_X,
            globalStartPK // Expose for tooltip or other uses if needed
        };
    }, [topology, pixelsPerMeter]);

    // 2. Plot Markers
    const markers = useMemo(() => {
        if (!geometry.sectionGeo) return [];

        return dalots.map(d => {
            const secId = String(d.section_id);
            const section = geometry.sectionGeo[secId];

            // If section not found in topology, we can't plot accurately
            if (!section) return null;

            const pk = parsePK(d.pk_transmis || d.pk_etude);

            // Calculate X based on section's visual start
            // Marker Offset = PK - SectionStartPK
            // Visual X = SectionVisualStart + Offset
            const offset = pk - section.startPK;
            const visualX = section.visualStartX + offset;

            // For branches, handle curve positioning
            const isBranch = section.type === 'branch';
            const curveForwardPx = 50; // Must match the curve forward distance in rendering

            let x, y;

            if (isBranch) {
                // Calculate how many meters the curve zone represents
                const curveZoneMeters = curveForwardPx / pixelsPerMeter;

                if (offset < curveZoneMeters) {
                    // Dalot is within the curve zone - position along the curve
                    // Find parent section to get the main line Y position
                    const parentId = section.fromSection;
                    const parentGeo = geometry.sectionGeo ? geometry.sectionGeo[parentId] : null;
                    const parentY = parentGeo ? parentGeo.y : section.y - 100;
                    const branchY = section.y;
                    const startX = section.pxStart;

                    // Calculate t (0 to 1) for position along curve
                    const t = offset / curveZoneMeters;

                    // Quadratic bezier: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
                    // P0 = (startX, parentY), P1 = (startX, branchY), P2 = (startX + curveForwardPx, branchY)
                    const p0x = startX, p0y = parentY;
                    const p1x = startX, p1y = branchY;
                    const p2x = startX + curveForwardPx, p2y = branchY;

                    x = Math.pow(1 - t, 2) * p0x + 2 * (1 - t) * t * p1x + Math.pow(t, 2) * p2x;
                    y = Math.pow(1 - t, 2) * p0y + 2 * (1 - t) * t * p1y + Math.pow(t, 2) * p2y;
                } else {
                    // Dalot is past the curve zone - on the straight branch line
                    x = visualX * pixelsPerMeter + geometry.bufferX + curveForwardPx;
                    y = section.y;
                }
            } else {
                // Main/continuous sections - straight line
                x = visualX * pixelsPerMeter + geometry.bufferX;
                y = section.y;
            }

            return {
                ...d,
                x,
                y,
                color: getStatusColor(d.status),
                pkVal: pk
            };
        }).filter(Boolean); // Filter out unplottable dalots
    }, [dalots, geometry, pixelsPerMeter]);

    // 3. Ticks (for Main Line only usually, or per section?)
    const ticks = useMemo(() => {
        if (!geometry.sectionGeo) return [];

        const tickInterval = 5000; // 5km
        const allTicks = [];

        // Generate ticks for all sections
        geometry.sections.forEach(section => {
            const isBranch = section.type === 'branch';
            const curveForward = 50; // Must match the curve forward in pixels

            // Determine range
            const start = section.startPK;
            const end = section.endPK;

            // Round start up to next interval for regular ticks
            const firstTick = Math.ceil(start / tickInterval) * tickInterval;

            // For branches, add PK 0 tick at the intersection point on the main line
            if (isBranch && start === 0) {
                // Find parent section to get the main line Y position
                const parentId = section.fromSection;
                const parentGeo = geometry.sectionGeo ? geometry.sectionGeo[parentId] : null;
                const mainLineY = parentGeo ? parentGeo.y : section.y - 100;

                allTicks.push({
                    x: section.pxStart, // At the junction point on the main line
                    y: mainLineY,
                    label: formatPK(0),
                    id: `${section.id}-0-junction`
                });
            }
            // For branches, skip PK 0 in the regular loop since we added it separately above
            const startTick = isBranch && firstTick === 0 ? tickInterval : firstTick;

            for (let pk = startTick; pk <= end; pk += tickInterval) {
                const offset = pk - section.startPK;
                const visualX = section.visualStartX + offset;
                // For branches, add the curve offset to position ticks on the visible line
                const curveOffsetPx = isBranch ? curveForward : 0;
                const x = visualX * pixelsPerMeter + geometry.bufferX + curveOffsetPx;

                allTicks.push({
                    x,
                    y: section.y,
                    label: formatPK(pk),
                    id: `${section.id}-${pk}`
                });
            }

            // Add explicit end tick if it doesn't fall on a regular interval
            if (end % tickInterval !== 0) {
                const offset = end - section.startPK;
                const visualX = section.visualStartX + offset;
                const curveOffsetPx = isBranch ? curveForward : 0;
                const x = visualX * pixelsPerMeter + geometry.bufferX + curveOffsetPx;

                allTicks.push({
                    x,
                    y: section.y,
                    label: formatPK(end),
                    id: `${section.id}-${end}-end`
                });
            }
        });

        return allTicks;
    }, [geometry, pixelsPerMeter]);


    const handleZoomIn = () => setPixelsPerMeter(prev => Math.min(prev * 1.5, 2));
    const handleZoomOut = () => setPixelsPerMeter(prev => Math.max(prev / 1.5, 0.05));

    if (!topology.length) return <div className="p-4 text-center text-gray-500">No topology configuration found.</div>;

    return (
        <div className="dalot-schematic-container" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="schematic-controls">
                <div className="schematic-title">
                    <Map size={20} className="text-blue-600" />
                    <span>{isRTL ? 'مخطط خطي (PK)' : 'Linear Schematic (PK)'}</span>
                </div>
                <div className="zoom-controls">
                    <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={18} /></button>
                    <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={18} /></button>
                </div>
            </div>

            <div
                className="schematic-viewport"
                ref={viewportRef}
                onClick={() => isMobile && setSelectedDalot(null)}
            >
                <svg width={geometry.width} height={geometry.height} className="schematic-svg">
                    {/* Definitions */}
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
                        </marker>
                    </defs>

                    {/* Connection Curves (Parent to Branch) */}
                    <g className="connections">
                        {geometry.sections.filter(s => s.type === 'branch').map(branch => {
                            // Find parent row Y
                            const parentId = branch.fromSection;
                            const parentGeo = geometry.sectionGeo[parentId];
                            if (!parentGeo) return null;

                            const parentY = parentGeo.y;
                            const branchY = branch.y;
                            const startX = branch.pxStart;

                            // Calculate a smooth junction curve that flows in the direction of travel
                            // Starts at branch point on main line, curves down and forward to meet branch
                            const curveForward = 50; // How far forward the curve extends on the branch
                            const branchCurveEndX = startX + curveForward;

                            // Quadratic bezier: starts on main line at branch point, curves down to branch line
                            const junctionCurve = `M ${startX} ${parentY} Q ${startX} ${branchY}, ${branchCurveEndX} ${branchY}`;

                            return (
                                <path
                                    key={`conn-${branch.id}`}
                                    d={junctionCurve}
                                    stroke="#94a3b8"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </g>

                    {/* Tracks */}
                    <g className="tracks">
                        {geometry.sections.map(section => {
                            // For branches, start the visible line where the junction curve ends (50px forward)
                            const isBranch = section.type === 'branch';
                            const curveForward = 50; // Must match the curve forward distance
                            const lineStartX = isBranch ? section.pxStart + curveForward : section.pxStart;
                            // Extend branch end to compensate for the curve offset
                            const lineEndX = isBranch ? section.pxEnd + curveForward : section.pxEnd;
                            // Position label after curve for branches
                            const labelX = isBranch ? section.pxStart + curveForward + 10 : section.pxStart + 10;

                            return (
                                <g key={section.id}>
                                    <line
                                        x1={lineStartX}
                                        y1={section.y}
                                        x2={lineEndX}
                                        y2={section.y}
                                        stroke={section.color}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                    <text
                                        x={labelX}
                                        y={section.y - 15}
                                        className="track-label"
                                        fill={section.color}
                                        fontSize="12"
                                        fontWeight="500"
                                    >
                                        {section.name} (PK {formatPK(section.startPK)} - {formatPK(section.endPK)})
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Ticks */}
                    <g className="ticks">
                        {ticks.map((t) => (
                            <g key={t.id} transform={`translate(${t.x}, ${t.y})`}>
                                <line y1="-5" y2="5" stroke="#cbd5e1" strokeWidth="2" />
                                <text y="-10" textAnchor="middle" className="axis-label" fontSize="10" fill="#94a3b8">{t.label}</text>
                            </g>
                        ))}
                    </g>

                    {/* Markers */}
                    <g className="markers">
                        {markers.map((d) => {
                            const baseSize = isMobile ? 8 : 5;
                            const activeSize = isMobile ? 12 : 8;
                            const isActive = (hoveredDalot?.id === d.id) || (selectedDalot?.id === d.id);

                            return (
                                <g
                                    key={d.id}
                                    transform={`translate(${d.x}, ${d.y})`}
                                    onMouseEnter={() => !isMobile && setHoveredDalot({ ...d, x: d.x, y: d.y })}
                                    onMouseLeave={() => !isMobile && setHoveredDalot(null)}
                                    onClick={(e) => {
                                        if (isMobile) {
                                            e.stopPropagation();
                                            setSelectedDalot(selectedDalot?.id === d.id ? null : { ...d, x: d.x, y: d.y });
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle
                                        r={isActive ? activeSize : baseSize}
                                        fill={d.color}
                                        stroke="white"
                                        strokeWidth="2"
                                        className="dalot-marker"
                                    />
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Tooltip Overlay */}
                {(hoveredDalot || selectedDalot) && (() => {
                    const activeDalot = hoveredDalot || selectedDalot;
                    // Smart tooltip positioning
                    const viewportWidth = viewportRef.current?.clientWidth || 400;
                    const tooltipWidth = isMobile ? 160 : 200;
                    let leftPos = activeDalot.x;

                    // Keep tooltip within viewport bounds
                    if (leftPos - tooltipWidth / 2 < 10) {
                        leftPos = tooltipWidth / 2 + 10;
                    } else if (leftPos + tooltipWidth / 2 > viewportWidth - 10) {
                        leftPos = viewportWidth - tooltipWidth / 2 - 10;
                    }

                    return (
                        <div
                            className="dalot-tooltip"
                            style={{
                                left: `${leftPos}px`,
                                top: `${activeDalot.y - (isMobile ? 100 : 120)}px`
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="tooltip-header">
                                {activeDalot.ouvrage_transmis || activeDalot.ouvrage_etude}
                            </div>
                            <div className="tooltip-row">
                                <span>PK:</span>
                                <span className="tooltip-val">{activeDalot.pk_transmis || activeDalot.pk_etude}</span>
                            </div>
                            <div className="tooltip-row">
                                <span>Dimension:</span>
                                <span className="tooltip-val">{activeDalot.dimension}</span>
                            </div>
                            <div className="tooltip-row">
                                <span>Status:</span>
                                <span
                                    className="tooltip-val"
                                    style={{ color: getStatusColor(activeDalot.status) }}
                                >
                                    {formatStatus(activeDalot.status)}
                                </span>
                            </div>
                            <div className="tooltip-row">
                                <span>Section:</span>
                                <span className="tooltip-val">
                                    {topology.find(s => s.id === String(activeDalot.section_id))?.name || activeDalot.section_id}
                                </span>
                            </div>
                            {isMobile && (
                                <div className="tooltip-row" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tap elsewhere to close</span>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default DalotSchematic;
