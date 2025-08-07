// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import './index.css'

// จุดเริ่มต้นของแอป - เราใช้ ReactDOM สร้างแอปจาก <App />
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ใช้ React Router สำหรับการเปลี่ยนหน้า */}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)