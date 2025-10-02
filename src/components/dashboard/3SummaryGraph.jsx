import { Bar } from 'react-chartjs-2';

const SummaryGraphCarousel = ({ 
    salesLoading,
    data, 
    deliveryData, 
    costChartData, 
    options,
    dineInSalesData,
    deliverySalesData,
    costData,
    filterMode,
    selectedMonth,
    selectedYear,
    months,
    formatNumber 
}) => {
    if (salesLoading) {
        return (
            <div className="bg-base-100 rounded-xl shadow p-8 flex flex-col items-center justify-center mb-6">
                <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                <span className="text-lg font-semibold text-base-content/70">กำลังโหลดข้อมูลยอดขายและต้นทุน...</span>
            </div>
        );
    }

    return (
        <>
            {/* Desktop - Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* กราฟยอดขายหน้าร้าน */}
                <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-primary">
                        📈 กราฟยอดขายหน้าร้านรายเดือน
                    </h2>
                    <div className="">
                        <Bar data={data} options={options} />
                    </div>
                    <div className="text-center">
                        <span className="text-lg font-semibold block sm:inline">
                            {filterMode === 'month'
                                ? `ยอดขายเดือน ${months[selectedMonth]} ${selectedYear} : `
                                : `ยอดขายปี ${selectedYear} : `}
                        </span>
                        <span className="text-2xl block sm:inline text-success">
                            {filterMode === 'month'
                                ? formatNumber(
                                    dineInSalesData
                                        .filter(item => {
                                            const date = new Date(item.saleDate);
                                            return (
                                                date.getMonth() === selectedMonth &&
                                                date.getFullYear() === selectedYear
                                            );
                                        })
                                        .reduce((sum, item) => sum + item.totalAmount, 0)
                                )
                                : formatNumber(
                                    dineInSalesData
                                        .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                                        .reduce((sum, item) => sum + item.totalAmount, 0)
                                )}
                            บาท
                        </span>
                    </div>
                </div>

                {/* กราฟยอดขายเดลิเวอรี่ */}
                <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-accent">
                        🛵 กราฟยอดขายเดลิเวอรี่รายเดือน
                    </h2>
                    <div className="">
                        <Bar data={deliveryData} options={options} />
                    </div>
                    <div className="text-center">
                        <span className="text-lg font-semibold block sm:inline">
                            {filterMode === 'month'
                                ? `ยอดขายเดลิเวอรี่เดือน ${months[selectedMonth]} ${selectedYear} : `
                                : `ยอดขายเดลิเวอรี่ปี ${selectedYear} : `}
                        </span>
                        <span className="text-2xl block sm:inline text-accent">
                            {filterMode === 'month'
                                ? formatNumber(
                                    deliverySalesData
                                        .filter(item => {
                                            const date = new Date(item.saleDate);
                                            return (
                                                date.getMonth() === selectedMonth &&
                                                date.getFullYear() === selectedYear
                                            );
                                        })
                                        .reduce((sum, item) => sum + item.totalAmount, 0)
                                )
                                : formatNumber(
                                    deliverySalesData
                                        .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                                        .reduce((sum, item) => sum + item.totalAmount, 0)
                                )}
                            บาท
                        </span>
                    </div>
                </div>

                {/* กราฟต้นทุน */}
                <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-warning">
                        💸 กราฟต้นทุนรายเดือน
                    </h2>
                    <div className="">
                        <Bar data={costChartData} options={options} />
                    </div>
                    <div className="text-center">
                        <span className="text-lg font-semibold block sm:inline">
                            {filterMode === 'month'
                                ? `ต้นทุนเดือน ${months[selectedMonth]} ${selectedYear} : `
                                : `ต้นทุนปี ${selectedYear} : `}
                        </span>
                        <span className="text-2xl block sm:inline text-warning">
                            {filterMode === 'month'
                                ? formatNumber(
                                    costData
                                        .filter(item => {
                                            const date = new Date(item.costDate);
                                            return (
                                                date.getMonth() === selectedMonth &&
                                                date.getFullYear() === selectedYear
                                            );
                                        })
                                        .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                                )
                                : formatNumber(
                                    costData
                                        .filter(item => new Date(item.costDate).getFullYear() === selectedYear)
                                        .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                                )}
                            บาท
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile - Carousel Layout */}
            <div className="md:hidden">
                {/* Carousel Navigation Indicators */}
                <div className="flex justify-center mb-4 space-x-2">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-xs text-primary font-medium">หน้าร้าน</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <span className="text-xs text-accent font-medium">เดลิเวอรี่</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                        <span className="text-xs text-warning font-medium">ต้นทุน</span>
                    </div>
                </div>

                {/* Charts Carousel */}
                <div className="carousel rounded-xl shadow-lg w-full">
                    {/* กราฟยอดขายหน้าร้าน */}
                    <div id="chart1" className="carousel-item w-full">
                        <div className="bg-base-100 rounded-xl p-4 w-full flex flex-col">
                            <div className="flex items-center justify-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <h2 className="text-lg font-semibold text-primary">
                                        📈 ยอดขายหน้าร้าน
                                    </h2>
                                </div>
                            </div>
                            <div className="mb-4">
                                <Bar data={data} options={options} />
                            </div>
                            <div className="text-center bg-primary/10 rounded-lg p-3">
                                <div className="text-sm font-medium text-primary/80 mb-1">
                                    {filterMode === 'month'
                                        ? `${months[selectedMonth]} ${selectedYear}`
                                        : `ปี ${selectedYear}`}
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {filterMode === 'month'
                                        ? formatNumber(
                                            dineInSalesData
                                                .filter(item => {
                                                    const date = new Date(item.saleDate);
                                                    return (
                                                        date.getMonth() === selectedMonth &&
                                                        date.getFullYear() === selectedYear
                                                    );
                                                })
                                                .reduce((sum, item) => sum + item.totalAmount, 0)
                                        )
                                        : formatNumber(
                                            dineInSalesData
                                                .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                                                .reduce((sum, item) => sum + item.totalAmount, 0)
                                        )}
                                    บาท
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* กราฟยอดขายเดลิเวอรี่ */}
                    <div id="chart2" className="carousel-item w-full">
                        <div className="bg-base-100 rounded-xl p-4 w-full flex flex-col">
                            <div className="flex items-center justify-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                                    <h2 className="text-lg font-semibold text-accent">
                                        🛵 ยอดขายเดลิเวอรี่
                                    </h2>
                                </div>
                            </div>
                            <div className="mb-4">
                                <Bar data={deliveryData} options={options} />
                            </div>
                            <div className="text-center bg-accent/10 rounded-lg p-3">
                                <div className="text-sm font-medium text-accent/80 mb-1">
                                    {filterMode === 'month'
                                        ? `${months[selectedMonth]} ${selectedYear}`
                                        : `ปี ${selectedYear}`}
                                </div>
                                <div className="text-xl font-bold text-accent">
                                    {filterMode === 'month'
                                        ? formatNumber(
                                            deliverySalesData
                                                .filter(item => {
                                                    const date = new Date(item.saleDate);
                                                    return (
                                                        date.getMonth() === selectedMonth &&
                                                        date.getFullYear() === selectedYear
                                                    );
                                                })
                                                .reduce((sum, item) => sum + item.totalAmount, 0)
                                        )
                                        : formatNumber(
                                            deliverySalesData
                                                .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                                                .reduce((sum, item) => sum + item.totalAmount, 0)
                                        )}
                                    บาท
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* กราฟต้นทุน */}
                    <div id="chart3" className="carousel-item w-full">
                        <div className="bg-base-100 rounded-xl p-4 w-full flex flex-col">
                            <div className="flex items-center justify-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                                    <h2 className="text-lg font-semibold text-warning">
                                        💸 ต้นทุนรายเดือน
                                    </h2>
                                </div>
                            </div>
                            <div className="mb-4">
                                <Bar data={costChartData} options={options} />
                            </div>
                            <div className="text-center bg-warning/10 rounded-lg p-3">
                                <div className="text-sm font-medium text-warning/80 mb-1">
                                    {filterMode === 'month'
                                        ? `${months[selectedMonth]} ${selectedYear}`
                                        : `ปี ${selectedYear}`}
                                </div>
                                <div className="text-xl font-bold text-warning">
                                    {filterMode === 'month'
                                        ? formatNumber(
                                            costData
                                                .filter(item => {
                                                    const date = new Date(item.costDate);
                                                    return (
                                                        date.getMonth() === selectedMonth &&
                                                        date.getFullYear() === selectedYear
                                                    );
                                                })
                                                .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                                        )
                                        : formatNumber(
                                            costData
                                                .filter(item => new Date(item.costDate).getFullYear() === selectedYear)
                                                .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                                        )}
                                    บาท
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carousel Navigation Buttons */}
                <div className="flex w-full justify-center py-4 gap-2">
                    <a href="#chart1" className="btn btn-xs btn-primary btn-outline">📈</a>
                    <a href="#chart2" className="btn btn-xs btn-accent btn-outline">🛵</a>
                    <a href="#chart3" className="btn btn-xs btn-warning btn-outline">💸</a>
                </div>

                {/* Swipe Instruction */}
                <div className="text-center mt-2">
                    <p className="text-xs text-base-content/50">👆 แตะปุ่มหรือเลื่อนเพื่อดูกราฟอื่น ๆ</p>
                </div>
            </div>
        </>
    );
};

export default SummaryGraphCarousel;

