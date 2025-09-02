import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "", // ✅ เพิ่ม field นี้
    name: "",
    dateOfBirth: "",
    startWorkDate: "",
    site: "",
    contact: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async () => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.username || !formData.password || !formData.name || !formData.site) {
        alert("กรุณากรอกข้อมูลที่จำเป็น (username, password, name, site)");
        return;
      }

      // ✅ ตรวจสอบรหัสผ่านตรงกันหรือไม่
      if (formData.password !== formData.confirmPassword) {
        alert("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      setIsLoading(true);

      // ✅ ส่งข้อมูลไป API (ไม่ส่ง confirmPassword)
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      await api.post("/auth/register", dataToSend, {
        headers: {
          "X-Site": formData.site,
          "Content-Type": "application/json"
        }
      });

      alert("ลงทะเบียนสำเร็จ!");
      navigate("/"); // กลับไปหน้า login

    } catch (error) {
      console.error("Registration error:", error);
      alert("ลงทะเบียนไม่สำเร็จ: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/");
  };

  // ✅ ตรวจสอบรหัสผ่านตรงกันหรือไม่
  const passwordsMatch = formData.password === formData.confirmPassword;
  const showPasswordError = formData.confirmPassword && !passwordsMatch;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 gap-4">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-96 border p-6">
        <legend className="fieldset-legend text-lg font-semibold">สมัครสมาชิก</legend>

        {/* Username */}
        <label className="label">
          <span className="label-text">Username *</span>
        </label>
        <input
          type="text"
          name="username"
          className="input input-bordered w-full"
          placeholder="ชื่อผู้ใช้"
          value={formData.username}
          onChange={handleInputChange}
        />

        {/* Password */}
        <label className="label">
          <span className="label-text">Password *</span>
        </label>
        <input
          type="password"
          name="password"
          className="input input-bordered w-full"
          placeholder="รหัสผ่าน"
          value={formData.password}
          onChange={handleInputChange}
        />

        {/* ✅ Confirm Password */}
        <label className="label">
          <span className="label-text">ยืนยันรหัสผ่าน *</span>
        </label>
        <input
          type="password"
          name="confirmPassword"
          className={`input input-bordered w-full ${showPasswordError ? 'input-error' : ''}`}
          placeholder="ยืนยันรหัสผ่าน"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />
        {/* ✅ แสดง error message */}
        {showPasswordError && (
          <label className="label">
            <span className="label-text-alt text-error">รหัสผ่านไม่ตรงกัน</span>
          </label>
        )}

        {/* Name */}
        <label className="label">
          <span className="label-text">ชื่อ-นามสกุล *</span>
        </label>
        <input
          type="text"
          name="name"
          className="input input-bordered w-full"
          placeholder="ชื่อ-นามสกุล"
          value={formData.name}
          onChange={handleInputChange}
        />

        {/* Date of Birth */}
        <label className="label">
          <span className="label-text">วันเกิด</span>
        </label>
        <input
          type="date"
          name="dateOfBirth"
          className="input input-bordered w-full"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
        />

        {/* Start Work Date */}
        <label className="label">
          <span className="label-text">วันที่เริ่มงาน</span>
        </label>
        <input
          type="datetime-local"
          name="startWorkDate"
          className="input input-bordered w-full"
          value={formData.startWorkDate}
          onChange={handleInputChange}
        />

        {/* Site */}
        <label className="label">
          <span className="label-text">สาขา *</span>
        </label>
        <select
          name="site"
          className="select select-bordered w-full"
          value={formData.site}
          onChange={handleInputChange}
        >
          <option value="">เลือกสาขา</option>
          <option value="HKT">ภูเก็ต (HKT)</option>
          <option value="BKK">กรุงเทพฯ (BKK)</option>
        </select>

        {/* Contact */}
        <label className="label">
          <span className="label-text">เบอร์โทรศัพท์</span>
        </label>
        <input
          type="tel"
          name="contact"
          className="input input-bordered w-full"
          placeholder="เบอร์โทรศัพท์"
          value={formData.contact}
          onChange={handleInputChange}
        />

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            className="btn btn-primary flex-1"
            onClick={handleRegister}
            disabled={isLoading || showPasswordError} // ✅ ปิดปุ่มถ้ารหัสผ่านไม่ตรง
          >
            {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
          
          <button
            className="btn btn-outline flex-1"
            onClick={goToLogin}
            disabled={isLoading}
          >
            กลับไปเข้าสู่ระบบ
          </button>
        </div>

        {/* Required field note */}
        <div className="text-xs text-base-content/60 mt-2 text-center">
          * ช่องที่จำเป็นต้องกรอก
        </div>
      </fieldset>
    </div>
  );
}

export default Register;