import { Navigate, Route, Routes } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Main from "./pages/Main"
import Settings from "./pages/Settings"
import Statistics from "./pages/Statistics"
import { getAppSettings } from "./utils/storage"

export default function App() {
  const settings = getAppSettings()
  const isDark = settings.tema === "dark"

  return (
    <div
      className={`flex min-h-screen flex-col pt-20 transition-colors ${
        isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      }`}
    >
      <Header />

      <main className="flex-grow px-4 pb-6">
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main" element={<Main />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="*" element={<Navigate to="/main" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}