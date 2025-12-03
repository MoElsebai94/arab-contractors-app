import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { MousePointer2, Hand, ZoomIn } from 'lucide-react';

const DalotGeometry = ({ sectionType, length, tetes, puisard }) => {
    const { cells, width, height } = useMemo(() => {
        const parts = sectionType.split('x').map(Number);
        if (parts.length === 2) {
            return { cells: 1, width: parts[0], height: parts[1] };
        } else if (parts.length === 3) {
            return { cells: parts[0], width: parts[1], height: parts[2] };
        }
        return { cells: 1, width: 1, height: 1 }; // Default
    }, [sectionType]);

    const wallThickness = 0.2;
    const totalWidth = (cells * width) + ((cells + 1) * wallThickness);
    const totalHeight = height + (2 * wallThickness);

    const shape = useMemo(() => {
        const shape = new THREE.Shape();

        // Outer rectangle
        shape.moveTo(0, 0);
        shape.lineTo(totalWidth, 0);
        shape.lineTo(totalWidth, totalHeight);
        shape.lineTo(0, totalHeight);
        shape.lineTo(0, 0);

        // Inner holes (cells)
        for (let i = 0; i < cells; i++) {
            const hole = new THREE.Path();
            const x = wallThickness + (i * (width + wallThickness));
            const y = wallThickness;

            hole.moveTo(x, y);
            hole.lineTo(x + width, y);
            hole.lineTo(x + width, y + height);
            hole.lineTo(x, y + height);
            hole.lineTo(x, y);

            shape.holes.push(hole);
        }

        return shape;
    }, [cells, width, height, totalWidth, totalHeight]);

    const extrudeSettings = useMemo(() => ({
        steps: 1,
        depth: length,
        bevelEnabled: false
    }), [length]);

    return (
        <group>
            {/* Main Culvert Body */}
            <mesh rotation={[0, 0, 0]} position={[-totalWidth / 2, -totalHeight / 2, -length / 2]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshPhysicalMaterial
                    color="#94a3b8"
                    roughness={0.7}
                    metalness={0.1}
                    clearcoat={0.05}
                    flatShading={false}
                />
            </mesh>

            {/* Têtes (Headwalls) */}
            {parseInt(tetes) > 0 && (
                <>
                    <Headwall
                        position={[0, -totalHeight / 2, length / 2]}
                        rotation={[0, 0, 0]}
                        width={totalWidth}
                        height={totalHeight}
                        wallThickness={wallThickness}
                        sectionType={sectionType}
                    />

                    {parseInt(tetes) > 1 && (
                        <Headwall
                            position={[0, -totalHeight / 2, -length / 2]}
                            rotation={[0, Math.PI, 0]}
                            width={totalWidth}
                            height={totalHeight}
                            wallThickness={wallThickness}
                            sectionType={sectionType}
                        />
                    )}
                </>
            )}

            {/* Puisard (Sump) */}
            {parseInt(puisard) > 0 && (
                <Puisard
                    position={[0, -totalHeight / 2, -length / 2]}
                    rotation={[0, 0, 0]}
                    width={totalWidth}
                    height={totalHeight}
                    wallThickness={wallThickness}
                    sectionType={sectionType}
                />
            )}


        </group>
    );
};

const HEADWALL_DIMS = {
    '1x3x3': {
        length: 4.25, // Z projection (along flow)
        flare: 3.08,  // X projection (side flare)
        thickness: 0.40 // Wall thickness
    },
    '2x2x1': {
        length: 1.22,
        flare: 1.03,
        thickness: 0.20
    },
    '2x1.5x2': {
        length: 2.92, // User specified 2.92, ignoring 2.67
        flare: 1.69,
        thickness: 0.25
    },
    '1x2x1': {
        length: 1.35,
        flare: 1.10,
        thickness: 0.25
    },
    '1x1.5x2': {
        length: 2.92,
        flare: 1.94,
        thickness: 0.20
    },
    '1x1': {
        length: 1.35,
        flare: 0.97,
        thickness: 0.20
    }
};

const Headwall = ({ position, rotation, width, height, wallThickness, sectionType }) => {
    // Default dimensions if not specified
    let zProj = 1.5;
    let xProj = 1.5 * Math.tan(Math.PI / 6); // ~0.866
    let currentThickness = wallThickness;

    // Override with specific dimensions if available
    if (HEADWALL_DIMS[sectionType]) {
        const dims = HEADWALL_DIMS[sectionType];
        zProj = dims.length;
        xProj = dims.flare;
        currentThickness = dims.thickness;
    }

    const wingwallLength = Math.sqrt(zProj * zProj + xProj * xProj);
    const endHeight = height * 0.4; // Height at the end of the wingwall
    const cutoffDepth = 0.5; // Depth of the bêche

    // Wingwall Shape (Side profile - Length vs Height)
    const wingwallShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(wingwallLength, 0);
        shape.lineTo(wingwallLength, endHeight);
        shape.lineTo(0, height);
        shape.lineTo(0, 0);
        return shape;
    }, [wingwallLength, endHeight, height]);

    const extrudeSettings = { steps: 1, depth: currentThickness, bevelEnabled: false };

    // Apron Shape (Trapezoid floor)
    const apronShape = useMemo(() => {
        const shape = new THREE.Shape();
        const halfWidth = width / 2;

        shape.moveTo(-halfWidth, 0);
        shape.lineTo(halfWidth, 0);
        shape.lineTo(halfWidth + xProj, -zProj);
        shape.lineTo(-(halfWidth + xProj), -zProj);
        shape.lineTo(-halfWidth, 0);
        return shape;
    }, [width, xProj, zProj]);

    const apronExtrudeSettings = { steps: 1, depth: currentThickness, bevelEnabled: false };

    // Rotation angles for wingwalls
    // Right wingwall: -atan2(z, x)
    const rightWingwallRotation = -Math.atan2(zProj, xProj);

    // Left wingwall: -atan2(z, -x)
    const leftWingwallRotation = -Math.atan2(zProj, -xProj);

    // Offsets to handle extrusion direction and thickness
    // Right Wingwall: Extrudes inwards relative to local frame.
    // Shift vector: (sin(-rot)*T, 0, cos(-rot)*T) ?
    // Local Z axis after rotation 'rot': (-sin(rot), 0, cos(rot)) ?
    // No, let's use the previous logic which worked for -60 deg.
    // Previous: (0.866*T, 0, -0.5*T).
    // 0.866 = sin(60) = -sin(-60).
    // -0.5 = -cos(60) = -cos(-60).
    // So shift is (-sin(rot)*T, 0, -cos(rot)*T).
    const rightOffset = [
        -Math.sin(rightWingwallRotation) * currentThickness,
        0,
        -Math.cos(rightWingwallRotation) * currentThickness
    ];

    // Left Wingwall: Extrudes outwards relative to local frame.
    // No offset needed if positioned at the corner.
    const leftOffset = [0, 0, 0];

    return (
        <group position={position} rotation={rotation}>
            {/* Apron (Radier) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <extrudeGeometry args={[apronShape, apronExtrudeSettings]} />
                <meshPhysicalMaterial color="#94a3b8" side={THREE.DoubleSide} roughness={0.8} />
            </mesh>

            {/* Left Wingwall */}
            <group position={[-width / 2 + leftOffset[0], 0, leftOffset[2]]} rotation={[0, leftWingwallRotation, 0]}>
                <mesh position={[0, 0, 0]}>
                    <extrudeGeometry args={[wingwallShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

            {/* Right Wingwall */}
            <group position={[width / 2 + rightOffset[0], 0, rightOffset[2]]} rotation={[0, rightWingwallRotation, 0]}>
                <mesh position={[0, 0, 0]}>
                    <extrudeGeometry args={[wingwallShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

            {/* Cutoff Wall (Bêche) */}
            <mesh position={[0, -cutoffDepth / 2 + currentThickness, zProj + currentThickness / 2]}>
                <boxGeometry args={[width + (2 * xProj) + (2 * currentThickness), cutoffDepth, currentThickness]} />
                <meshPhysicalMaterial color="#475569" roughness={0.9} />
            </mesh>

            {/* Upper Beam (Poutre de rive) */}
            <mesh position={[0, height + (currentThickness / 2), -currentThickness / 2]}>
                <boxGeometry args={[width, currentThickness, currentThickness]} />
                <meshPhysicalMaterial color="#64748b" roughness={0.7} />
            </mesh>
        </group>
    );
};

const Puisard = ({ position, rotation, width, height, wallThickness, sectionType }) => {
    // Corrected Dimensions based on Plan View
    // Width (Transverse to flow) = 1.90m
    // Length (Along flow) = 1.40m
    const P_WIDTH = 1.90;
    const P_LENGTH = 1.40;
    const P_HEIGHT = sectionType === '1x1' ? 2.00 : height + 0.6;
    const THICKNESS = 0.20;
    const CULVERT_OUTER_WIDTH = 1.40;

    // Vertical positioning
    // The bottom of the puisard is beneath the bottom of the main body by 20 cm (lowered another 10cm).
    const bottomY = -0.20;

    // Component Heights
    const floorH = THICKNESS;
    const wallH = P_HEIGHT - floorH;

    // Beam (Lintel) above the culvert opening
    // Goes from Top of Culvert (height) to Top of Puisard (bottomY + P_HEIGHT)
    const puisardTopY = bottomY + P_HEIGHT;
    const beamHeight = Math.max(0, puisardTopY - height);
    const hasBeam = beamHeight > 0.01;

    const extrudeSettings = { steps: 1, depth: THICKNESS, bevelEnabled: false };

    // Helper to create a centered rectangular shape with an optional hole
    const createWallShape = (w, h, holeSpec) => {
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, -h / 2);
        shape.lineTo(w / 2, -h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(-w / 2, h / 2);
        shape.lineTo(-w / 2, -h / 2);

        if (holeSpec) {
            const hole = new THREE.Path();
            hole.moveTo(holeSpec.x - holeSpec.w / 2, holeSpec.y - holeSpec.h / 2);
            hole.lineTo(holeSpec.x + holeSpec.w / 2, holeSpec.y - holeSpec.h / 2);
            hole.lineTo(holeSpec.x + holeSpec.w / 2, holeSpec.y + holeSpec.h / 2);
            hole.lineTo(holeSpec.x - holeSpec.w / 2, holeSpec.y + holeSpec.h / 2);
            hole.lineTo(holeSpec.x - holeSpec.w / 2, holeSpec.y - holeSpec.h / 2);
            shape.holes.push(hole);
        }
        return shape;
    };

    // 1. End Wall (Far End)
    // Full Width (1.90) x WallHeight.
    const endWallShape = useMemo(() => {
        return createWallShape(P_WIDTH, wallH, null);
    }, [P_WIDTH, wallH]);

    // 2. Side Walls (Left and Right)
    // Length = P_LENGTH - 2 * THICKNESS (1.40 - 0.40 = 1.00).
    // Opening: 0.50m wide.
    // User requested to "widen it from the top side" leaving only 40cm from the top.
    // wallH = 1.80m. Top is at +0.90m.
    // Target Top of Hole = 0.90 - 0.40 = 0.50m.
    // Previous Bottom was at -0.30m.
    // New Height = 0.50 - (-0.30) = 0.80m.
    // New Center Y = (-0.30 + 0.50) / 2 = 0.10m.
    const sideWallLength = P_LENGTH - 2 * THICKNESS;
    const sideWallShape = useMemo(() => {
        return createWallShape(sideWallLength, wallH, {
            w: 0.50,
            h: 0.80,
            x: 0,
            y: 0.10
        });
    }, [sideWallLength, wallH]);

    // 3. Front Wall Segments (Connecting to Culvert)
    // Total Width = 1.90. Culvert Hole = 1.40.
    // Two segments of width (1.90 - 1.40) / 2 = 0.25m.
    // Or simpler: A full width wall with a 1.40m hole?
    // Yes, that ensures alignment.
    const frontWallShape = useMemo(() => {
        return createWallShape(P_WIDTH, wallH, {
            w: CULVERT_OUTER_WIDTH,
            h: wallH, // Full height hole? Or matching culvert height?
            // Culvert is 'height' high. Wall is 'wallH' high.
            // Culvert sits on floor? No, culvert floor is at 0.
            // Puisard floor is lower.
            // Hole should match culvert profile.
            // Let's just use two separate boxes for simplicity and to avoid hole artifacts.
            x: 0, y: 0
        });
    }, [P_WIDTH, wallH, CULVERT_OUTER_WIDTH]);

    // Alternative Front Segments:
    // Left Segment: Width = (1.90 - 1.40)/2 = 0.25.
    const frontSegmentWidth = (P_WIDTH - CULVERT_OUTER_WIDTH) / 2;
    const frontSegmentShape = useMemo(() => {
        return createWallShape(frontSegmentWidth, wallH, null);
    }, [frontSegmentWidth, wallH]);

    // 4. Beam Shape
    const beamShape = useMemo(() => {
        return createWallShape(CULVERT_OUTER_WIDTH, beamHeight, null);
    }, [CULVERT_OUTER_WIDTH, beamHeight]);


    // 4. Floor
    // Dimensions: Width x Length
    const floorShape = useMemo(() => {
        return createWallShape(P_WIDTH, P_LENGTH, null);
    }, [P_WIDTH, P_LENGTH]);


    return (
        <group position={position} rotation={rotation}>
            {/* Floor */}
            <group position={[0, bottomY + THICKNESS / 2, -P_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <extrudeGeometry args={[floorShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#475569" roughness={0.9} />
                </mesh>
            </group>

            {/* End Wall (Far End) */}
            {/* Position Z = -P_LENGTH. Extrudes +Z to -P_LENGTH + THICKNESS. */}
            <group position={[0, bottomY + THICKNESS + wallH / 2, -P_LENGTH]} rotation={[0, 0, 0]}>
                <mesh>
                    <extrudeGeometry args={[endWallShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

            {/* Front Wall Segments (Near Culvert) */}
            {/* Position Z = -THICKNESS. Extrudes +Z to 0. */}
            {/* Left Segment */}
            <group position={[-CULVERT_OUTER_WIDTH / 2 - frontSegmentWidth / 2, bottomY + THICKNESS + wallH / 2, -THICKNESS]} rotation={[0, 0, 0]}>
                <mesh>
                    <extrudeGeometry args={[frontSegmentShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>
            {/* Right Segment */}
            <group position={[CULVERT_OUTER_WIDTH / 2 + frontSegmentWidth / 2, bottomY + THICKNESS + wallH / 2, -THICKNESS]} rotation={[0, 0, 0]}>
                <mesh>
                    <extrudeGeometry args={[frontSegmentShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

            {/* Beam (Lintel) */}
            {hasBeam && (
                <group position={[0, height + beamHeight / 2, -THICKNESS]} rotation={[0, 0, 0]}>
                    <mesh>
                        <extrudeGeometry args={[beamShape, extrudeSettings]} />
                        <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                    </mesh>
                </group>
            )}

            {/* Left Side Wall */}
            {/* Position X = -P_WIDTH/2. Extrudes +X (due to rotation +Y 90) to -P_WIDTH/2 + THICKNESS. */}
            {/* Z Center = -THICKNESS - sideWallLength/2. */}
            <group position={[-P_WIDTH / 2, bottomY + THICKNESS + wallH / 2, -THICKNESS - sideWallLength / 2]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                    <extrudeGeometry args={[sideWallShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

            {/* Right Side Wall */}
            {/* Position X = P_WIDTH/2 - THICKNESS. Extrudes +X to P_WIDTH/2. */}
            <group position={[P_WIDTH / 2 - THICKNESS, bottomY + THICKNESS + wallH / 2, -THICKNESS - sideWallLength / 2]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                    <extrudeGeometry args={[sideWallShape, extrudeSettings]} />
                    <meshPhysicalMaterial color="#64748b" roughness={0.7} />
                </mesh>
            </group>

        </group>
    );
};

const DalotVisualization = ({ params }) => {
    return (
        <div className="dalot-viz-container">
            <style>{`
                .dalot-viz-container {
                    width: 100%;
                    height: 500px;
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .viz-overlay {
                    position: absolute;
                    bottom: 1rem;
                    left: 1rem;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: #1e293b;
                    pointer-events: none;
                    z-index: 10;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    backdrop-filter: blur(4px);
                }

                @media (max-width: 640px) {
                    .dalot-viz-container {
                        height: 350px;
                    }
                    .viz-overlay {
                        display: none;
                    }
                }
            `}</style>

            {/* UI Overlay */}
            <div className="viz-overlay">
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f59e0b' }}>Controls</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <MousePointer2 size={14} color="#64748b" />
                    <span>Left Click: Rotate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Hand size={14} color="#64748b" />
                    <span>Right Click: Pan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ZoomIn size={14} color="#64748b" />
                    <span>Scroll: Zoom</span>
                </div>
            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 5, 8], fov: 45 }}>
                <color attach="background" args={['#f8fafc']} />
                <OrbitControls
                    makeDefault
                    enablePan={true}
                    enableDamping={true}
                    dampingFactor={0.05}
                    minDistance={3}
                    maxDistance={30}
                />

                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />

                <group position={[0, -1, 0]}>
                    <DalotGeometry
                        sectionType={params.sectionType}
                        length={params.dalotLength}
                        tetes={params.tetes}
                        puisard={params.puisard}
                    />
                    <ContactShadows
                        position={[0, -0.01, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2}
                        far={4.5}
                    />
                </group>
            </Canvas>
        </div>
    );
};

export default DalotVisualization;
