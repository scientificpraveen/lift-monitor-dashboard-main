import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
const API_URL = `${API_BASE}/stp`;

// --- VISUAL COMPONENTS (INLINE STYLES FOR RELIABILITY) ---

// 1. Static Arrow
const StaticArrow = ({ x, y, rotate = 0, color = "#1e3a8a", scale = 1 }) => (
    <div
        style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `rotate(${rotate}deg) scale(${scale})`,
            transformOrigin: 'center',
            width: '40px',
            height: '40px',
            zIndex: 30,
            pointerEvents: 'none'
        }}
    >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill={color} stroke="none" />
        </svg>
    </div>
);

// 2. Fan
const Fan = ({ x, y, status, label, scale = 1 }) => {
    const getColor = (s) => {
        if (s === 1) return '#22c55e'; // Green
        if (s === 2) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };
    const mainColor = getColor(status);
    const isAnimate = status === 1;
    const isPulse = status === 2;

    return (
        <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 50, pointerEvents: 'none' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: `2px solid ${status === 2 ? '#fdba74' : mainColor}`,
                backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                animation: isPulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24"
                    className={isAnimate ? "animate-spin" : ""}
                    style={{ color: mainColor }}>
                    <path fill="currentColor" d="M12 12c0-3 2.5-3 3-5 1-4-3-5-3-5s-4 1-3 5c0.5 2 3 2 3 5z" opacity="0.8" />
                    <path fill="currentColor" d="M12 12c3 0 3 2.5 5 3 4 1 5-3 5-3s-1-4-5-3c-2 0.5-2 3-5 3z" opacity="0.8" />
                    <path fill="currentColor" d="M12 12c0 3-2.5 3-3 5-1 4 3 5 3 5s4-1 3-5c-0.5-2-3-2-3-5z" opacity="0.8" />
                    <path fill="currentColor" d="M12 12c-3 0-3-2.5-5-3-4-1-5 3-5 3s1 4 5 3c2-0.5 2-3 5-3z" opacity="0.8" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
            </div>
            {label && (
                <div style={{
                    marginTop: '4px', backgroundColor: 'white', padding: '2px 4px', borderRadius: '4px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    {label.split('\n').map((line, i) => (
                        <span key={i} style={{ fontSize: '14px', fontWeight: 900, color: '#4b5563', whiteSpace: 'nowrap', lineHeight: '1.1' }}>{line}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

// 3. Pipe
const Pipe = ({ points, isFlowing, isStatic = false, color = "#cbd5e1", width = "8", hideWater = false, isReverse = false, flowColor = "#0ea5e9", duration = 1.5 }) => {
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0 }}>
            <path d={points} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" style={{ opacity: 1, transition: 'stroke 0.3s ease' }} />
            {!hideWater && (isFlowing || (isStatic && color !== "#06b6d4")) && (
                <motion.path
                    d={points} fill="none" stroke={flowColor} strokeWidth={Math.max(1, parseFloat(width) - 2)} strokeLinecap="round" strokeDasharray="20, 30"
                    initial={{ strokeDashoffset: 0 }}
                    animate={isReverse ? { strokeDashoffset: 120 } : { strokeDashoffset: -120 }}
                    transition={{ repeat: Infinity, duration: duration, ease: "linear" }}
                    style={{ filter: `drop-shadow(0 0 2px ${flowColor})` }}
                />
            )}
        </svg>
    );
};

// 4. Tank
const Tank = ({ label, subLabel, x, y, width = "192px", height = "144px", specialLabel = null, indicatorValue = null, indicatorColor = "#0891b2", labelPosition = "outside", specialStatus = null, indicatorOffset = 0, showBubbles = false }) => {
    const isOrange = indicatorColor === '#f97316' || specialStatus === 2;
    const animationStyle = isOrange ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {};

    return (
        <div style={{
            position: 'absolute', left: x, top: y, width: width, height: height, borderRadius: '14px',
            border: '2px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backgroundColor: 'white', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: '10px'
        }}>
            <div style={{ width: '100%', textAlign: 'center', zIndex: 25 }}>
                <div style={{ color: '#1f2937', fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2 }}>
                    {label && label.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                </div>
                {subLabel && subLabel.includes("Water Level:") ? (
                    <div style={{ marginTop: '25px', marginLeft: '-45px', color: '#1e3a8a', fontSize: '35px', fontWeight: '900', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
                        {subLabel.replace("Water Level: ", "")}
                    </div>
                ) : subLabel && (
                    <div style={{ marginTop: '4px', color: subLabel.includes("Water Level") ? '#1e3a8a' : '#1f2937', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {subLabel}
                    </div>
                )}
            </div>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '70%', backgroundColor: 'rgba(219, 234, 254, 0.5)', zIndex: 10 }}>
                <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 400 100">
                    <motion.path d="M0 20 Q 100 0, 200 20 T 400 20 V 100 H 0 Z" fill="rgba(14, 165, 233, 0.2)" animate={{ x: [-400, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} />
                    <motion.path d="M0 30 Q 100 50, 200 30 T 400 30 V 100 H 0 Z" fill="rgba(56, 189, 248, 0.3)" animate={{ x: [0, -400] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                    {showBubbles && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.circle key={i} cx={50 + i * 40} cy={120} r={4 + (i % 3)} fill="rgba(255, 255, 255, 0.6)"
                                    animate={{ cy: [120, 20], opacity: [0, 1, 0] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.5, ease: "easeOut" }} />
                            ))}
                        </>
                    )}
                </svg>
            </div>
            {
                (specialLabel || indicatorValue) && (
                    <div style={{ position: 'absolute', bottom: `${8 + indicatorOffset}px`, right: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: indicatorColor, border: '2px solid white',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...animationStyle
                        }}>
                            {indicatorValue ? (
                                <span style={{ color: 'white', fontSize: '16px', fontWeight: 900, textShadow: '0 1px 1px rgba(0,0,0,0.2)', lineHeight: 1 }}>{indicatorValue}</span>
                            ) : (labelPosition === 'inside' && specialLabel && (
                                <span style={{ color: 'white', fontSize: '15px', fontWeight: 900, textShadow: '0 1px 1px rgba(0,0,0,0.2)', lineHeight: 1.1 }}>
                                    {specialLabel.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                </span>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// 5. Motor
const Motor = ({ id, status, label, x, y }) => {
    const getBg = (s) => s === 1 ? 'linear-gradient(to bottom right, #22c55e, #16a34a)' : s === 2 ? 'linear-gradient(to bottom right, #fb923c, #f97316)' : 'linear-gradient(to bottom right, #ef4444, #dc2626)';
    const getBorder = (s) => s === 1 ? '2px solid #4ade80' : s === 2 ? '2px solid #fdba74' : '2px solid #f87171';
    const getShadow = (s) => s === 1 ? '0 0 10px #86efac' : s === 2 ? '0 0 10px #fdba74' : 'none';

    return (
        <div style={{ position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '50%', background: getBg(status), border: getBorder(status), boxShadow: getShadow(status),
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '14px',
                animation: status === 2 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none', opacity: status !== 1 && status !== 2 ? 0.9 : 1
            }}>
                {id}
            </div>
            {label && (
                <div style={{
                    marginTop: '4px', padding: '2px 8px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '4px',
                    fontSize: '14px', fontWeight: 900, color: '#4b5563', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.25
                }}>
                    {label.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                </div>
            )}
        </div>
    );
};

// 6. ParallelPipe
const ParallelPipe = ({ x, y, length, orientation = 'horizontal', m1, m2, flowForward = true, arrowPlacement = [] }) => {
    const gap = 40;
    const split = 30;
    let stemIn, stemOut, loopTop, loopBottom, m1Pos, m2Pos, a1Pos, a2Pos, arrowAngle;
    const flowOffset = -40;
    const isM1On = m1.status === 1;
    const isM2On = m2.status === 1;
    const isAnyOn = isM1On || isM2On;

    if (orientation === 'horizontal') {
        const midY = y;
        const startX = x;
        const endX = x + length;
        stemIn = `M ${startX} ${midY} L ${startX + split} ${midY}`;
        stemOut = `M ${endX - split} ${midY} L ${endX} ${midY}`;
        loopTop = `M ${startX + split} ${midY} L ${startX + split} ${midY - gap} L ${endX - split} ${midY - gap} L ${endX - split} ${midY}`;
        loopBottom = `M ${startX + split} ${midY} L ${startX + split} ${midY + gap} L ${endX - split} ${midY + gap} L ${endX - split} ${midY}`;
        m1Pos = { x: startX + length / 2 - 45, y: midY - gap - 19 };
        m2Pos = { x: startX + length / 2 - 45, y: midY + gap - 20 };
        arrowAngle = flowForward ? 0 : 180;
        const a1PipeY = midY - gap;
        const a1OffY = (arrowPlacement[0] || 'top') === 'top' ? -37 : ((arrowPlacement[0] || 'top') === 'bottom' ? -5 : -20);
        a1Pos = { x: m1Pos.x + 40 + flowOffset - 15, y: a1PipeY + a1OffY };
        const a2PipeY = midY + gap;
        const a2OffY = (arrowPlacement[1] || 'bottom') === 'bottom' ? -5 : ((arrowPlacement[1] || 'bottom') === 'top' ? -35 : -20);
        a2Pos = { x: m2Pos.x + 40 + flowOffset - 15, y: a2PipeY + a2OffY };
    } else {
        const midX = x;
        const startY = y;
        const endY = y + length;
        stemIn = `M ${midX} ${startY} L ${midX} ${startY + split}`;
        stemOut = `M ${midX} ${endY - split} L ${midX} ${endY}`;
        loopTop = `M ${midX} ${startY + split} L ${midX - gap} ${startY + split} L ${midX - gap} ${endY - split} L ${midX} ${endY - split}`;
        loopBottom = `M ${midX} ${startY + split} L ${midX + gap} ${startY + split} L ${midX + gap} ${endY - split} L ${midX} ${endY - split}`;
        m1Pos = { x: midX - gap - 35, y: startY + length / 2 - 32 };
        m2Pos = { x: midX + gap - 35, y: startY + length / 2 - 32 };
        arrowAngle = flowForward ? 90 : -90;
        const a1PipeX = midX - gap;
        const a1OffX = (arrowPlacement[0] || 'left') === 'left' ? -35 : ((arrowPlacement[0] || 'left') === 'right' ? -5 : -20);
        a1Pos = { x: a1PipeX + a1OffX, y: m1Pos.y + 24 + flowOffset - 25 };
        const a2PipeX = midX + gap;
        const a2OffX = (arrowPlacement[1] || 'right') === 'right' ? -5 : ((arrowPlacement[1] || 'right') === 'left' ? -35 : -20);
        a2Pos = { x: a2PipeX + a2OffX, y: m2Pos.y + 24 + flowOffset - 25 };
    }

    return (
        <>
            <Pipe points={stemIn} isFlowing={isAnyOn} color="#cbd5e1" width="8" isReverse={!flowForward} />
            <Pipe points={stemOut} isFlowing={isAnyOn} color="#cbd5e1" width="8" isReverse={!flowForward} />
            <Pipe points={loopTop} isFlowing={isM1On} color="#cbd5e1" width="8" isReverse={!flowForward} />
            <Pipe points={loopBottom} isFlowing={isM2On} color="#cbd5e1" width="8" isReverse={!flowForward} />
            <Motor id={m1.id} status={m1.status} x={`${m1Pos.x}px`} y={`${m1Pos.y}px`} label={m1.label} />
            <Motor id={m2.id} status={m2.status} x={`${m2Pos.x}px`} y={`${m2Pos.y}px`} label={m2.label} />
            <StaticArrow x={`${a1Pos.x}px`} y={`${a1Pos.y}px`} rotate={arrowAngle} />
            <StaticArrow x={`${a2Pos.x}px`} y={`${a2Pos.y}px`} rotate={arrowAngle} />
        </>
    );
};

// 7. FiveWayValveUnit (Updated with portsSide)
const FiveWayValveUnit = ({ x, y, label, status = 5, portsSide = 'left', invertVerticalLabels = false }) => {
    const getColor = (s) => {
        if (s === 1) return '#22c55e';
        if (s === 2) return '#3b82f6';
        if (s === 3) return '#a855f7';
        if (s === 4) return '#eab308';
        if (s === 5) return '#06b6d4';
        if (s === 6) return '#f97316';
        return '#ef4444';
    };
    const mainColor = getColor(status);
    const isPulse = status === 6;

    // Ports Logic
    // portsSide='right' (PSF): Vin/Vout on Right, Drain on Left.
    // portsSide='left' (ACF): Vin/Vout on Left, Drain on Right.
    const isRight = portsSide === 'right';
    const vinStyle = isRight ? { top: 12, right: -26 } : { top: 12, left: -26 };
    const voutStyle = isRight ? { bottom: 5, right: -40 } : { bottom: 5, left: -40 };
    const drainStyle = isRight ? { top: 35, left: -50 } : { top: 35, right: -50 };

    return (
        <div style={{ position: 'absolute', left: x, top: y, width: '80px', height: '60px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Center Inlet/Outlet */}
            <span style={{ position: 'absolute', top: -20, left: 35, width: '100%', textAlign: 'center', fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>
                {invertVerticalLabels ? "OUTLET" : "INLET"}
            </span>
            <span style={{ position: 'absolute', bottom: -25, left: 35, width: '100%', textAlign: 'center', fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>
                {invertVerticalLabels ? "INLET" : "OUTLET"}
            </span>

            {/* Side Ports */}
            <span style={{ position: 'absolute', ...vinStyle, fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>VIN</span>
            <span style={{ position: 'absolute', ...voutStyle, fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>VOUT</span>
            <span style={{ position: 'absolute', ...drainStyle, fontSize: '14px', color: '#ea580c', fontWeight: 'bold' }}>DRAIN</span>

            <div style={{
                width: '80px', height: '60px', borderRadius: '4px', backgroundColor: mainColor,
                border: status === 6 ? '2px dashed black' : '2px solid rgba(255,255,255,0.5)',
                position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                animation: isPulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {label}
                </div>
            </div>
        </div>
    );
};

// 8. CylindricalVessel (Updated with portsSide)
const CylindricalVessel = ({ label, x, y, showPorts = true, width = '120px', height = '180px', portsSide = 'left' }) => (
    <div style={{ position: 'absolute', left: x, top: y, width: width, height: height, zIndex: 15 }}>
        <div style={{
            width: '100%', height: '100%', borderRadius: '20px',
            background: 'linear-gradient(to right, #3b82f6, #60a5fa, #3b82f6)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2), 0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{label}</span>
        </div>
        <div style={{ position: 'absolute', top: -15, left: 0, width: '100%', height: '30px', borderRadius: '50%', backgroundColor: '#60a5fa', border: '1px solid #2563eb' }} />
        <div style={{ position: 'absolute', bottom: -15, left: 0, width: '100%', height: '30px', borderRadius: '50%', backgroundColor: '#1d4ed8', border: '1px solid #1e40af', zIndex: -1 }} />

        {showPorts && (
            <>
                <span style={{ position: 'absolute', top: -5, [portsSide === 'right' ? 'right' : 'left']: -30, fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>VIN</span>
                <span style={{ position: 'absolute', bottom: -6, [portsSide === 'right' ? 'right' : 'left']: -42, fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>VOUT</span>
            </>
        )}
    </div>
);

// 9. UV Unit
const UVUnit = ({ x, y, status = 2 }) => {
    const getBgColor = (s) => s === 1 ? '#22c55e' : s === 2 ? '#f97316' : '#ef4444';
    return (
        <div style={{ position: 'absolute', left: x, top: y, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
                width: '100px', height: '80px', backgroundColor: getBgColor(status), borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: `0 0 15px ${getBgColor(status)}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', overflow: 'hidden', padding: '10px 0',
                animation: status === 2 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: '100%', height: '8px', backgroundColor: '#c026d3', boxShadow: '0 0 8px #e879f9', opacity: 0.9 }} />
                ))}
            </div>
            <span style={{ marginTop: '5px', marginRight: '-80px', color: '#1e293b', fontWeight: 900, fontSize: '16px', textAlign: 'center', textTransform: 'uppercase' }}>UV LIGHT</span>
        </div>
    );
};

// 10. Dosing Pump
const DosingPump = ({ x, y, status = 2 }) => {
    const getColor = (s) => s === 1 ? '#22c55e' : s === 2 ? '#f97316' : '#ef4444';
    return (
        <div style={{ position: 'absolute', left: x, top: y, width: '80px', height: '80px', zIndex: 20 }}>
            <div style={{
                width: '100%', height: '100%', backgroundColor: getColor(status), clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                animation: status === 2 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textAlign: 'center', lineHeight: 1.2 }}>DOSING<br />PUMP</span>
            </div>
        </div>
    );
};

// 11. Monitor Box
const MonitorBox = ({ x, y, label, value, color = "#0ea5e9" }) => (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '4px 8px', backgroundColor: 'white', border: `2px solid ${color}`, borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minWidth: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: color }}>{value}</div>
        </div>
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {label.split('\n').map((line, i) => (
                <span key={i} style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', lineHeight: '1.1' }}>{line}</span>
            ))}
        </div>
    </div>
);


// --- MAIN DASHBOARD ---

const StpAutomation = ({ building }) => {
    const [data, setData] = useState({
        // Motors (Default 2 - Orange)
        M1: 2, M2: 2, M3: 2, M4: 2, M5: 2, M6: 2, M7: 2, M8: 2, M9: 2, M10: 2, M11: 2, M12: 2, M13: 2,
        // Blowers (Default 2 - Orange)
        B1: 2, B2: 2,
        // Valves (Default 2 - Orange)
        AirSolenoid: 2, ClarifierValve: 1, // Default 1 (Flowing)
        // Fans (Default 2 - Orange)
        FAF1: 2, FAF2: 2, EF1: 2, EF2: 2,
        // UV, Dosing, ARM (Default 2 - Orange)
        UV: 2, DosingPump: 2, ARM: 2,
        // PSF/ACF Valve (Default 6)
        PSFValve: 6, ACFValve: 6,
        // Tank Levels (Default 0, Display unit %)
        CollectionTankLevel: 0, SBRTankLevel: 0, SludgeTankLevel: 0, FilterTankLevel: 0, TreatedWaterTankLevel: 0, SoftwaterTankLevel: 0,
        // Pressure (Default 0.0, Display unit Bar)
        InletPressure: 0.0, OutletPressure: 0.0,
        // DO, TSS, TH (Default 0.0, Display unit mg/l)
        DO1: 0.0, DO2: 0.0, SBRTSS: 0.0, ClarifierTSS: 0.0, SoftnerTH: 0.0,
        // System Status
        deviceOnline: false
    });
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(API_URL);
                const json = await res.json();
                setData(prev => ({ ...prev, ...json }));
                setIsConnected(true);
            } catch (e) { setIsConnected(false); }
        };
        setInterval(fetchData, 1000);
    }, []);

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '100px', overflow: 'auto' }}>

            {/* Header Section */}
            <div className="standard-header" style={{ marginLeft: '20px', marginRight: '20px', marginTop: '25px' }}>
                <div>
                    <h2>STP AUTOMATION</h2>
                    <span className="subtitle">
                        Building Name: <strong>{building}</strong>
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #d1d5db', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                        <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                            animation: !isConnected ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                            {isConnected ? 'Dashboard Live' : 'Dashboard Offline'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #d1d5db', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                        <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            backgroundColor: data.deviceOnline ? '#22c55e' : '#ef4444',
                            animation: !data.deviceOnline ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                            {data.deviceOnline ? 'Device Live' : 'Device Offline'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Diagram Container */}
            <div style={{
                position: 'relative', minWidth: '2200px', height: '1500px', backgroundColor: 'white', margin: '0 auto',
                borderRadius: '40px', border: '1px solid #e5e7eb', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '16px', transform: 'scale(0.70)', transformOrigin: 'top center',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
            }}>
                <div style={{ position: 'relative', width: '1800px', height: '100%', marginTop: '50px' }}>

                    {/* --- PIPES LAYER --- */}

                    {/* Collection -> MBBR (M1, M2) */}
                    <ParallelPipe
                        x={242} y={150} length={258} orientation="horizontal"
                        m1={{ id: "M1", status: data.M1 ?? 2, label: "MBBR RSTP 1" }}
                        m2={{ id: "M2", status: data.M2 ?? 2, label: "MBBR RSTP 2" }}
                        arrowPlacement={['top', 'top']}
                    />

                    {/* MBBR -> Clarifier */}
                    <Pipe points="M 690 150 L 950 150" isFlowing={true} isStatic={false} width="8" />
                    <StaticArrow x="910px" y="105px" />

                    {/* Clarifier -> MBBR Return (M3, M4) */}
                    <ParallelPipe
                        x={692} y={210} length={258} orientation="horizontal"
                        m1={{ id: "M3", status: data.M3 ?? 2, label: "MBBR RCP 1" }}
                        m2={{ id: "M4", status: data.M4 ?? 2, label: "MBBR RCP 2" }}
                        flowForward={false}
                        arrowPlacement={['bottom', 'bottom']}
                    />

                    {/* Clarifier -> Filter Feed (Gravity) with Clarifier Valve */}
                    <Pipe points="M 1040 210 L 1040 480" isFlowing={data.ClarifierValve === 1} width="8" />
                    <StaticArrow x="1040px" y="440px" rotate={90} />

                    <Motor id="V" label={"CLARIFIER\nVALVE"} status={data.ClarifierValve ?? 1} x="990px" y="320px" />

                    {/* Sludge Inlet */}
                    <Pipe points="M 710 210 L 710 350 L 750 350" isFlowing={data.M3 === 1 || data.M4 === 1} width="8" />
                    <StaticArrow x="670px" y="240px" rotate={90} />

                    {/* SBR -> Collection UP (M5, M6) */}
                    <ParallelPipe
                        x={60} y={210} length={270} orientation="vertical"
                        m1={{ id: "M5", status: data.M5 ?? 2, label: "SBR\nRCP 1" }}
                        m2={{ id: "M6", status: data.M6 ?? 2, label: "SBR\nRCP 2" }}
                        flowForward={false}
                        arrowPlacement={['left', 'left']}
                    />

                    {/* Collection -> SBR DOWN (M7, M8) */}
                    <ParallelPipe
                        x={230} y={210} length={270} orientation="vertical"
                        m1={{ id: "M7", status: data.M7 ?? 2, label: "SBR\nRSTP 1" }}
                        m2={{ id: "M8", status: data.M8 ?? 2, label: "SBR\nRSTP 2" }}
                        arrowPlacement={['right', 'right']}
                    />

                    {/* SBR -> Filter Feed (M9) */}
                    <Pipe points="M 242 550 L 605 550" isFlowing={data.M9 === 1} width="8" />
                    <Motor id="M9" label={"SBR\nDCTP"} status={data.M9} x="600px" y="526px" />
                    <Pipe points="M 650 550 L 950 550" isFlowing={data.M9 === 1} width="8" />
                    <StaticArrow x="910px" y="515px" />

                    {/* Filter Feed -> PSF Valve (M10, M11) */}
                    <ParallelPipe
                        x={1046} y={624} length={200} orientation="vertical"
                        m1={{ id: "M10", status: data.M10 ?? 2, label: "FF PUMP\n1" }}
                        m2={{ id: "M11", status: data.M11 ?? 2, label: "FF PUMP\n2" }}
                        arrowPlacement={['left', 'left']}
                    />

                    {/* --- PSF STAGE FLOW LOGIC --- */}
                    {/* FF Pumps Merge (1046, 824) -> PSF Valve INLET (Top Center 1046, 870) */}
                    <Pipe points="M 1046 824 L 1046 870"
                        isFlowing={(data.M10 === 1 || data.M11 === 1)} width="8" />

                    {/* PSF VALVE (1006, 870) - Ports on Right */}
                    <FiveWayValveUnit x={1006} y={870} label="PSF VALVE" status={data.PSFValve ?? 5} portsSide="right" />

                    {/* PSF VESSEL (1120, 840) - Ports on Left */}
                    <CylindricalVessel label="PSF" x={1200} y={820} width="110px" height="160px" portsSide="left" />

                    {/* PSF Connections (Valve Right <-> Vessel Left) */}
                    {/* Vin: Valve Right (1086, 878) -> Vessel Left (1120, 878) */}
                    <Pipe points="M 1085 875 L 1150 875 L 1150 840 L 1200 840"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.PSFValve >= 1 && data.PSFValve <= 3)}
                        isReverse={(data.M10 === 1 || data.M11 === 1) && data.PSFValve === 2}
                        color="#94a3b8" width="8" flowColor="#3b82f6" />

                    {/* Vout: Vessel Left (1120, 924) -> Valve Right (1086, 924) */}
                    <Pipe points="M 1085 925 L 1150 925 L 1150 960 L 1200 960"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.PSFValve >= 1 && data.PSFValve <= 3)}
                        isReverse={(data.M10 === 1 || data.M11 === 1) && (data.PSFValve === 1 || data.PSFValve === 3)}
                        color="#94a3b8" width="8" flowColor="#3b82f6" />

                    {/* PSF Mode Label */}
                    {data.PSFValve >= 1 && data.PSFValve <= 5 && (
                        <div style={{
                            position: 'absolute', left: 1210, top: 1010, width: 100, textAlign: 'center',
                            fontSize: '14px', fontWeight: '900', textTransform: 'uppercase',
                            color: data.PSFValve === 1 ? '#166534' : data.PSFValve === 2 ? '#1e40af' :
                                data.PSFValve === 3 ? '#6b21a8' : data.PSFValve === 4 ? '#854d0e' :
                                    data.PSFValve === 5 ? '#06b6d4' : '#ef4444',
                            textShadow: '0 1px 0 rgba(255,255,255,0.8)'
                        }}>
                            {data.PSFValve === 1 ? "FILTER SERVICE" :
                                data.PSFValve === 2 ? "BACKWASH" :
                                    data.PSFValve === 3 ? "RINSE" :
                                        data.PSFValve === 4 ? "BYPASS-DRAIN" :
                                            data.PSFValve === 5 ? "BYPASS" : ""}
                        </div>
                    )}

                    {/* --- ACF STAGE --- */}
                    {/* PSF Output (Valve Bottom Center 1046, 930) -> ACF Inlet (Valve Bottom Center 340, 930) */}
                    {/* Route: Down to 1020, Left to 340, Up to 930 */}
                    <Pipe points="M 1046 930 L 1046 1040 L 340 1040 L 340 930"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.PSFValve === 1 || data.PSFValve === 5)} width="8" />

                    {/* ACF VALVE (300, 870) - Ports on Left (Default) */}
                    <FiveWayValveUnit x={300} y={870} label="ACF VALVE" status={data.ACFValve ?? 5} portsSide="left" invertVerticalLabels={true} />

                    {/* ACF VESSEL (140, 840) - Ports on Right */}
                    <CylindricalVessel label="ACF" x={100} y={820} width="110px" height="160px" portsSide="right" />

                    {/* ACF Connections (Valve Left <-> Vessel Right) */}
                    {/* Vin: Valve Left (300, 878) -> Vessel Right (240, 878) */}
                    <Pipe points="M 300 875 L 250 875 L 250 840 L 210 840"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve >= 1 && data.ACFValve <= 3)}
                        isReverse={(data.M10 === 1 || data.M11 === 1) && data.ACFValve === 2}
                        color="#94a3b8" width="8" flowColor="#3b82f6" />

                    {/* Vout: Vessel Right (240, 924) -> Valve Left (300, 924) */}
                    <Pipe points="M 300 925 L 250 925 L 250 960 L 210 960"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve >= 1 && data.ACFValve <= 3)}
                        isReverse={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve === 1 || data.ACFValve === 3)}
                        color="#94a3b8" width="8" flowColor="#3b82f6" />

                    {/* ACF Mode Label */}
                    {data.ACFValve >= 1 && data.ACFValve <= 5 && (
                        <div style={{
                            position: 'absolute', left: 100, top: 1010, width: 100, textAlign: 'center',
                            fontSize: '14px', fontWeight: '900', textTransform: 'uppercase',
                            color: data.ACFValve === 1 ? '#166534' : data.ACFValve === 2 ? '#1e40af' :
                                data.ACFValve === 3 ? '#6b21a8' : data.ACFValve === 4 ? '#854d0e' :
                                    data.ACFValve === 5 ? '#06b6d4' : '#ef4444',
                            textShadow: '0 1px 0 rgba(255,255,255,0.8)'
                        }}>
                            {data.ACFValve === 1 ? "FILTER SERVICE" :
                                data.ACFValve === 2 ? "BACKWASH" :
                                    data.ACFValve === 3 ? "RINSE" :
                                        data.ACFValve === 4 ? "BYPASS-DRAIN" :
                                            data.ACFValve === 5 ? "BYPASS" : ""}
                        </div>
                    )}

                    {/* --- ROW 2 FLOW: ACF Out -> UV --- */}
                    {/* ACF Outlet Top (340, 870) -> Up 780 -> Left 100 -> Down 1300 -> Right 250 */}
                    <Pipe points="M 340 870 L 340 780 L 50 780 L 50 1100"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve === 1 || data.ACFValve === 5)} width="8" />

                    <UVUnit x={5} y={1100} status={data.UV ?? 2} />

                    {/* UV -> TREATED TANK */}
                    <Pipe points="M 50 1180 L 50 1250 L 340 1250"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve === 1 || data.ACFValve === 5)} width="8" />

                    <DosingPump x={200} y={1100} status={data.DosingPump ?? 2} />
                    <Pipe points="M 240 1180 L 240 1250" isFlowing={data.DosingPump === 1} width="8" />

                    {/* 2. TREATED WATER TANK */}
                    <Tank label={"TREATED WATER\nTANK"} subLabel={`Water Level: ${data.TreatedWaterTankLevel ?? 0}%`} x="340px" y="1180px" />

                    <Pipe points="M 520 1250 L 620 1250" isFlowing={data.M12 === 1} width="8" />

                    <Motor id="M12" label={"FLUSHING\nPUMP"} status={data.M12} x="600px" y="1230px" />

                    <Pipe points="M 670 1250 L 800 1250" isFlowing={data.M12 === 1} width="8" />

                    <Pipe points="M 730 1250 L 730 1150" isFlowing={data.M12 === 1} width="8" />
                    <StaticArrow x="730px" y="1180px" rotate={-90} />
                    <div style={{ position: 'absolute', left: 700, top: 1120, fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>TO FLUSH</div>

                    <CylindricalVessel label="SOFTENER" x={800} y={1180} width="120px" height="170px" showPorts={false} />

                    <Pipe points="M 920 1250 L 1060 1250" isFlowing={data.M12 === 1} width="8" />

                    <StaticArrow x="920px" y="1210px" rotate={-45} color="#c026d3" />
                    <MonitorBox x={950} y={1120} label={"SOFTWATER\nTOTAL\nHARDNESS"} value={`${(data.SoftnerTH ?? 0.0).toFixed(2)} mg/l`} color="#c026d3" />

                    <Tank label={"SOFT WATER\nTANK"} subLabel={`Water Level: ${data.SoftwaterTankLevel ?? 0}%`} x="1060px" y="1190px" />

                    <Pipe points="M 1250 1250 L 1360 1250" isFlowing={data.M13 === 1} width="8" />

                    <Motor id="M13" status={data.M13} x="1310px" y="1230px" label={"SOFT WATER\nTRANSFER PUMP"} />

                    <Pipe points="M 1380 1230 L 1380 1150" isFlowing={data.M13 === 1} width="8" />
                    <StaticArrow x="1380px" y="1180px" rotate={-90} />
                    <div style={{ position: 'absolute', left: 1290, top: 1120, fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>TO COOLING TOWER</div>

                    {/* --- DRAIN SYSTEM --- */}
                    {/* PSF Drain: Start Left (1006, 900) -> 950, 900 -> 950, 660 */}
                    <Pipe points="M 1005 900 L 780 900 L 780 800 L 600 800"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.PSFValve >= 2 && data.PSFValve <= 4)}
                        color="#ef4444" width="8" flowColor="#fee2e2" />

                    {/* ACF Drain: Start Right (380, 900) -> 430, 900 -> 430, 660 */}
                    <Pipe points="M 380 900 L 450 900 L 450 800 L 600 800"
                        isFlowing={(data.M10 === 1 || data.M11 === 1) && (data.ACFValve >= 2 && data.ACFValve <= 4)}
                        color="#ef4444" width="8" flowColor="#fee2e2" />

                    {/* From Merge (y=660) Left to x=40 (Margin) -> Up towards M5 (150) -> Tank Right (242) */}
                    <Pipe points="M 600 800 L 600 730 L -30 730 L -30 150 L 45 150"
                        isFlowing={((data.M10 === 1 || data.M11 === 1) && (data.PSFValve >= 2 && data.PSFValve <= 4)) ||
                            ((data.M10 === 1 || data.M11 === 1) && (data.ACFValve >= 2 && data.ACFValve <= 4))}
                        color="#ef4444" width="8" flowColor="#fee2e2" />

                    {/* Drain Pipeline Arrows */}
                    <StaticArrow x="450px" y="850px" rotate={-90} color="#ef4444" />
                    <StaticArrow x="740px" y="850px" rotate={-90} color="#ef4444" />
                    <StaticArrow x="550px" y="690px" rotate={180} color="#ef4444" />
                    <StaticArrow x="-35px" y="500px" rotate={-90} color="#ef4444" />
                    <StaticArrow x="10px" y="145px" rotate={0} color="#ef4444" />

                    {/* PSF Inlet Pipeline Arrows */}
                    <StaticArrow x="1040px" y="800px" rotate={90} />

                    {/* PSF Outlet to ACF Inlet Pipeline Arrows */}
                    <StaticArrow x="1040px" y="980px" rotate={90} />
                    <StaticArrow x="650px" y="1000px" rotate={-180} />
                    <StaticArrow x="338px" y="980px" rotate={-90} />

                    {/* ACF Outlet to Treated Water Tank Arrows */}
                    <StaticArrow x="335px" y="780px" rotate={-90} />
                    <StaticArrow x="180px" y="740px" rotate={-180} />
                    <StaticArrow x="10px" y="1050px" rotate={90} />
                    <StaticArrow x="100px" y="1250px" rotate={0} />

                    {/* Dosing Pump Pipeline Arrows */}
                    <StaticArrow x="235px" y="1190px" rotate={90} />

                    <StaticArrow x="550px" y="1250px" rotate={0} />
                    <StaticArrow x="750px" y="1250px" rotate={0} />
                    <StaticArrow x="1020px" y="1250px" rotate={0} />
                    <StaticArrow x="1300px" y="1250px" rotate={0} />

                    {/* --- MONITORING LAYER (Pressure / TSS) --- */}
                    {/* Inlet Pressure: Line from T-Junction (1046, 750) to Arrow */}
                    <Pipe points="M 1040 820 L 960 820" width="3" color="#0891b2" />
                    <StaticArrow x="925px" y="800px" rotate={-180} color="#0891b2" />
                    <MonitorBox x={820} y={800} label={"INLET PRESSURE"} value={`${(data.InletPressure ?? 0.0).toFixed(2)} Bar`} color="#0891b2" />

                    {/* Outlet Pressure: Line from PSF Out (1046, 950) to Arrow (Left side) */}
                    <Pipe points="M 1040 970 L 960 970" width="3" color="#0891b2" />
                    <StaticArrow x="925px" y="950px" rotate={-180} color="#0891b2" />
                    <MonitorBox x={810} y={950} label={"OUTLET PRESSURE"} value={`${(data.OutletPressure ?? 0.0).toFixed(2)} Bar`} color="#0891b2" />

                    {/* SBR TSS */}
                    <StaticArrow x="238px" y="548px" rotate={45} color="#c026d3" />
                    <MonitorBox x={272} y={565} label="SBR TSS" value={`${(data.SBRTSS ?? 0.0).toFixed(2)} mg/l`} color="#c026d3" />

                    {/* Clarifier TSS */}
                    <StaticArrow x="1040px" y="240px" rotate={0} color="#c026d3" />
                    <MonitorBox x={1070} y={240} label="CLARIFIER TSS" value={`${(data.ClarifierTSS ?? 0.0).toFixed(2)} mg/l`} color="#c026d3" />

                    {/* --- TANKS LAYER --- */}
                    <Tank label="Collection Tank" subLabel={`Water Level: ${data.CollectionTankLevel ?? 0}%`} x="50px" y="80px" />

                    <Tank
                        label={"MBBR AERATION\nTANK"}
                        x="500px" y="80px"
                        specialLabel="DO1"
                        indicatorValue={`${(data.DO1 ?? 0.0).toFixed(2)} mg/l`}
                        indicatorColor="#0891b2"
                        indicatorOffset={-10}
                        showBubbles={true}
                    />

                    <Tank label={"CLARIFIER TANK\nWITH ARM"} x="950px" y="80px" labelPosition="inside" />
                    <Fan x="1060px" y="140px" label="ARM" status={data.ARM ?? 2} scale={1.2} />

                    <Tank label={"SLUDGE HOLDING\nTANK"} subLabel={`Water Level: ${data.SludgeTankLevel ?? 0}%`} x="750px" y="310px" />

                    <Tank
                        label="SBR Tank"
                        subLabel={`Water Level: ${data.SBRTankLevel ?? 0}%`}
                        x="50px" y="480px"
                        specialLabel="DO2"
                        indicatorValue={`${(data.DO2 ?? 0.0).toFixed(2)} mg/l`}
                        indicatorColor="#0891b2"
                        indicatorOffset={-10}
                        showBubbles={true}
                    />
                    <Tank label="Filter Feed Tank" subLabel={`Water Level: ${data.FilterTankLevel ?? 0}%`} x="950px" y="480px" />

                    {/* --- FANS --- */}
                    <Fan x="1450px" y="550px" label={"FRESH AIR\nFAN 1"} status={data.FAF1} />
                    <Fan x="1650px" y="550px" label={"FRESH AIR\nFAN 2"} status={data.FAF2} />
                    <Fan x="1450px" y="670px" label={"EXHAUST\nFAN 1"} status={data.EF1} />
                    <Fan x="1650px" y="670px" label={"EXHAUST\nFAN 2"} status={data.EF2} />

                    {/* --- CENTRAL BLOWER SYSTEM --- */}
                    <Fan id="B1" label="BLOWER 1" status={data.B1} x="620px" y="340px" />
                    <Fan id="B2" label="BLOWER 2" status={data.B2} x="620px" y="440px" />

                    <Pipe points="M 640 360 L 600 360" isFlowing={data.B1 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <Pipe points="M 640 460 L 600 460" isFlowing={data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <Pipe points="M 600 360 L 600 410" isFlowing={data.B1 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <Pipe points="M 600 460 L 600 410" isFlowing={data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <Pipe points="M 600 410 L 550 410" isFlowing={data.B1 === 1 || data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />

                    <Pipe points="M 550 410 L 550 220" isFlowing={data.B1 === 1 || data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <StaticArrow x="550px" y="230px" rotate={-90} color="#eab308" />

                    <Pipe points="M 550 380 L 350 380 L 350 260 L 170 180" isFlowing={data.B1 === 1 || data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <StaticArrow x="300px" y="250px" rotate={-155} color="#eab308" />

                    <Pipe points="M 550 410 L 550 490 L 485 490" isFlowing={data.B1 === 1 || data.B2 === 1} width="8" color="#eab308" flowColor="#fef08a" />
                    <StaticArrow x="520px" y="490px" rotate={-180} color="#eab308" />

                    <Motor id="V" label={"AIR SOLENOID"} status={data.AirSolenoid} x="400px" y="465px" />
                    <StaticArrow x="240px" y="490px" rotate={-180} color="#eab308" />

                    <Pipe points="M 435 490 L 242 490" isFlowing={(data.B1 === 1 || data.B2 === 1) && data.AirSolenoid === 1} width="8" color="#eab308" flowColor="#fef08a" />

                    {/* --- SCALE & LEGEND --- */}
                    <div style={{
                        position: 'absolute', left: 1400, top: 100, width: 400, height: 360,
                        display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 10,
                        border: '2px solid #cbd5e1', borderRadius: '14px', padding: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#334155', textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>SCALE</div>


                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '60px', height: '8px', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#991b1b' }}>DRAIN PIPELINE OF VALVE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: '#0891b2', border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transform: 'scale(0.4)', transformOrigin: 'left center' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0891b2' }}>DO SENSOR (in mg/l)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#22c55e', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>FILTER SERVICE VALVE MODE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>BACKWASH VALVE MODE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#a855f7', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b21a8' }}>RINSE VALVE MODE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#eab308', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#854d0e' }}>BYPASS-DRAIN VALVE MODE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#06b6d4', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0891b2' }}>BYPASS VALVE MODE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StpAutomation;
