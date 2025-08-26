import React, { useState } from 'react';
import ModalUpdateCost from '../components/stock/ModalUpdateCost';

// ตัวอย่างข้อมูลสินค้า (ในแอปจริงควรดึงจาก API)

const mockStockItems = [
    { id: 1, name: 'Item A', cost: 100 },
    { id: 2, name: 'Item B', cost: 200 },
    { id: 3, name: 'Item C', cost: 300 },
];

const StockItem = () => {
    const [items, setItems] = useState(mockStockItems);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const handleUpdateCost = (id, newCost) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, cost: newCost } : item
        ));
        handleModalClose();
    };

    return (
        <div>
            <h2>Stock Items</h2>
            <table>
                <thead>
                    <tr>
                        <th>ชื่อสินค้า</th>
                        <th>ราคา</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.cost}</td>
                            <td>
                                <button onClick={() => handleEditClick(item)}>
                                    แก้ไข
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {showModal && selectedItem && (
                <ModalUpdateCost
                    item={selectedItem}
                    onClose={handleModalClose}
                    onUpdate={handleUpdateCost}
                />
            )}
        </div>
    );
};

export default StockItem;