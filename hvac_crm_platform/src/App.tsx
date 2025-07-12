import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import MobilePage from "./pages/MobilePage";
import { SignInForm } from "./SignInForm";

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const location = useLocation();

  // Check if we're on mobile route
  const isMobileRoute = location.pathname === "/mobile";

  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <Routes>
          {/* Mobile Route */}
          <Route path="/mobile" element={<MobilePage />} />

          {/* Desktop Routes */}
          <Route
            path="/*"
            element={
              <div className="flex h-screen">
                <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-auto p-6">
                    <Dashboard activeModule={activeModule} />
                  </main>
                </div>
              </div>
            }
          />
        </Routes>
      </Authenticated>

      <Unauthenticated>
        {isMobileRoute ? (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">HVAC Mobile</h1>
              <p className="text-gray-600 mb-6">
                Please sign in to access the mobile technician interface.
              </p>
              <SignInForm />
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-900 mb-2">HVAC Pro CRM</h1>
                <p className="text-gray-600">Professional HVAC Management Platform</p>
              </div>
              <SignInForm />
            </div>
          </div>
        )}
      </Unauthenticated>

      <Toaster />
    </div>
  );
}
