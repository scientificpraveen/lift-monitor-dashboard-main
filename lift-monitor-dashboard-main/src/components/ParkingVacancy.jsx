import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

const ParkingVacancy = () => {
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
        const isOccupied = slots[slotId] === 1;
        return (
            <div
                key={slotId}
                style={{
                    width: '200px',
                    height: '300px',
                    border: '4px solid #374151',
                    borderRadius: '12px',
                    backgroundColor: isOccupied ? '#fee2e2' : '#dcfce7', // Red tint if occupied, Green tint if vacant
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

                {isOccupied ? (
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
            padding: '40px',
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <h1 style={{
                fontSize: '36px',
                fontWeight: '900',
                color: '#1f2937',
                marginBottom: '40px',
                textAlign: 'center'
            }}>
                PARKING SLOT VACANCY
            </h1>

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
