import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

const ParkingVacancy = ({ building }) => {
    const [slots, setSlots] = useState({ P1: 0, P2: 0, P3: 0, P4: 0 });
    const [loading, setLoading] = useState(true);

    const fetchSlots = async () => {
        try {
            const res = await fetch(`${API_BASE}/parking-slots`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (error) {
            console.error("Error fetching parking slots:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
        const interval = setInterval(fetchSlots, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const renderSlot = (slotId) => {
        const slotData = slots[slotId];
        // Handle both old (number) and new (object) data formats for robustness during transition
        const isObject = typeof slotData === 'object' && slotData !== null;
        const isOccupied = isObject ? slotData.value === 1 : slotData === 1;
        const lastUpdated = isObject ? slotData.lastUpdated : Date.now(); // Default to now if legacy

        const now = Date.now();
        const timeDiff = now - lastUpdated;
        const isOffline = timeDiff > 60000; // 1 minute timeout

        // Determine Styles based on state
        let bgColor = '#dcfce7'; // Default Vacant (Green)
        let borderColor = '#16a34a';
        if (isOffline) {
            bgColor = '#ffedd5'; // Orange-50
            borderColor = '#ea580c'; // Orange-600
        } else if (isOccupied) {
            bgColor = '#fee2e2'; // Red-50
            borderColor = '#dc2626'; // Red-600
        }

        return (
            <div
                key={slotId}
                style={{
                    width: '200px',
                    height: '300px',
                    border: `4px solid ${borderColor}`,
                    borderRadius: '12px',
                    backgroundColor: bgColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '20px',
                    position: 'relative',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#374151'
                }}>
                    {slotId}
                </div>

                {isOffline ? (
                    <>
                        <style>
                            {`
                                @keyframes pulseBgOrange {
                                    0%, 100% { background-color: #ffedd5; } /* Light orange */
                                    50% { background-color: #fdba74; } /* Lighter orange */
                                }
                            `}
                        </style>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            width: '100%', height: '100%', borderRadius: '8px',
                            animation: 'pulseBgOrange 2s ease-in-out infinite',
                        }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ea580c', textAlign: 'center' }}>
                                SENSOR<br />DISCONNECTED
                            </span>
                        </div>
                    </>
                ) : isOccupied ? (
                    <>
                        <img
                            src="/car_top_view.png"
                            alt="Car"
                            style={{ width: '120px', height: 'auto', marginBottom: '10px' }}
                        />
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>OCCUPIED</span>
                    </>
                ) : (
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>VACANT</span>
                )}
            </div>
        );
    };

    return (
        <div style={{
            padding: '25px',
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div className="standard-header" style={{ width: '100%', marginBottom: '40px' }}>
                <div>
                    <h2>PARKING SLOT VACANCY</h2>
                    <span className="subtitle">
                        Building Name: <strong>{building}</strong>
                    </span>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
                {['P1', 'P2', 'P3', 'P4'].map(id => renderSlot(id))}
            </div>
        </div>
    );
};

export default ParkingVacancy;
