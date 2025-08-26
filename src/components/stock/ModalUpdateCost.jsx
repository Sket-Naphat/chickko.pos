import React, { useState, useEffect } from 'react';

const ModalUpdateCost = ({ open, onClose, stockId }) => {
    const [cost, setCost] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (stockId && stockId !== 'new') {
            // ดึงข้อมูลรายการ stock เดิมมาแสดง
            fetch(`https://chickko.api/stock/${stockId}`)
                .then(res => res.json())
                .then(data => setCost(data.cost || ''))
                .catch(() => setCost(''));
        } else {
            setCost('');
        }
    }, [stockId]);

    const handleUpdate = async () => {
        setLoading(true);
        const method = stockId === 'new' ? 'POST' : 'PUT';
        const url = stockId === 'new'
            ? 'https://chickko.api/stock'
            : `https://chickko.api/stock/${stockId}`;
        const body = JSON.stringify({ cost });

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });
            onClose(true); // ส่ง true เพื่อแจ้งว่าอัพเดทสำเร็จ
        } catch (error) {
            console.error('Error updating stock cost:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>{stockId === 'new' ? 'เพิ่มรายการ Stock' : 'แก้ไขต้นทุน Stock'}</h2>
                <label>
                    ต้นทุน:
                    <input
                        type="number"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                        disabled={loading}
                    />
                </label>
                <div style={{ marginTop: 16 }}>
                    <button onClick={handleUpdate} disabled={loading || !cost}>
                        {loading ? 'กำลังบันทึก...' : 'อัพเดท'}
                    </button>
                    <button onClick={() => onClose(false)} disabled={loading} style={{ marginLeft: 8 }}>
                        ยกเลิก
                    </button>
                </div>
            </div>
            <style>{`
                .modal-backdrop {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: #fff; padding: 24px; border-radius: 8px; min-width: 300px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                input[type="number"] {
                    margin-left: 8px;
                    padding: 4px;
                }
                button {
                    padding: 6px 16px;
                }
            `}</style>
        </div>
    );
};

export default ModalUpdateCost;