import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import LearningPathDetail from './pages/LearningPathDetail'
import LessonView from './pages/LessonView'
import QuizView from './pages/QuizView'
import CertificateView from './pages/CertificateView'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learning-path/:id" element={<LearningPathDetail />} />
          <Route path="/lesson/:id" element={<LessonView />} />
          <Route path="/quiz/:id" element={<QuizView />} />
          <Route path="/certificate/:uuid" element={<CertificateView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

