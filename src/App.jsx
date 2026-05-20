import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute, PublicRoute } from './components/auth/ProtectedRoute';
import RoutePageLoader from './components/ui/PageLoader';
import { lazyWithRetry } from './utils/lazyWithRetry';

// ─── Landing page — eager loaded (always shown first) ─────────────────────────
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Departments from './components/Departments';
import HowItWorks from './components/HowItWorks';
import Analytics from './components/Analytics';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

// ─── Auth & Dashboard pages — lazy loaded ─────────────────────────────────────
const LoginPage = lazyWithRetry(() => import('./pages/auth/LoginPage'), 'LoginPage');
const SignupPage = lazyWithRetry(() => import('./pages/auth/SignupPage'), 'SignupPage');
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const CitizenDashboard = lazyWithRetry(() => import('./pages/dashboards/CitizenDashboard'), 'CitizenDashboard');
const OfficerDashboard = lazyWithRetry(() => import('./pages/dashboards/OfficerDashboard'), 'OfficerDashboard');
const AdminDashboard = lazyWithRetry(() => import('./pages/dashboards/AdminDashboard'), 'AdminDashboard');
const UnauthorizedPage = lazyWithRetry(() => import('./pages/UnauthorizedPage'), 'UnauthorizedPage');

// ─── Landing page ─────────────────────────────────────────────────────────────
function LandingPage() {
      return (
            <div className="min-h-screen font-sans">
                  <Navbar />
                  <main>
                        <Hero />
                        <Features />
                        <Departments />
                        <HowItWorks />
                        <Analytics />
                        <WhyChooseUs />
                        <Testimonials />
                        <CTA />
                  </main>
                  <Footer />
            </div>
      );
}

// ─── Toast config ─────────────────────────────────────────────────────────────
const toastOptions = {
      duration: 4000,
      style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            fontSize: '14px',
            fontWeight: '500',
      },
      success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
      error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
      return (
            <BrowserRouter>
                  <AuthProvider>
                        <Toaster position="top-right" toastOptions={toastOptions} />
                        <Suspense fallback={<RoutePageLoader />}>
                              <Routes>
                                    {/* Landing */}
                                    <Route path="/" element={<LandingPage />} />

                                    {/* Auth — redirect away if already logged in */}
                                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                                    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                                    <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

                                    {/* Protected dashboards */}
                                    <Route path="/citizen/dashboard" element={
                                          <RoleRoute roles={['citizen']}><CitizenDashboard /></RoleRoute>
                                    } />
                                    <Route path="/officer/dashboard" element={
                                          <RoleRoute roles={['officer']}><OfficerDashboard /></RoleRoute>
                                    } />
                                    <Route path="/admin/dashboard" element={
                                          <RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>
                                    } />

                                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                        </Suspense>
                  </AuthProvider>
            </BrowserRouter>
      );
}
