import ThemeToggle from "../components/ThemeToggle";

export default function Cost() {
  return (
    <div className="p-4 space-y-4">
      {/* แถบหัวเรื่อง + ปุ่มสลับธีม */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">บันทึกค่าใช้จ่าย</h1>
      </div>

      {/* การ์ดตัวอย่างเพื่อเห็นสีธีมเปลี่ยน */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="form-control">
              <div className="label"><span className="label-text">จำนวนเงิน (บาท)</span></div>
              <input type="number" className="input input-bordered" placeholder="เช่น 120.00" />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">วันที่</span></div>
              <input type="date" className="input input-bordered" />
            </label>

            <label className="form-control">
              <div className="label"><span className="label-text">ประเภท</span></div>
              <select className="select select-bordered">
                <option>วัตถุดิบ</option>
                <option>ค่าแรง</option>
                <option>ค่าน้ำ/ไฟ</option>
                <option>อื่น ๆ</option>
              </select>
            </label>
          </div>

          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary">บันทึก</button>
            <button className="btn btn-ghost">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  );
}