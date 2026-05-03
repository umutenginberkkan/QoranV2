import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  getAppSettings,
  getSavedUser,
  removeSavedUser,
  saveUser,
  type User,
} from "../utils/storage"

type FormType = "login" | "register" | null

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [formType, setFormType] = useState<FormType>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [user, setUser] = useState<User | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const settings = getAppSettings()
  const isDark = settings.tema === "dark"

  useEffect(() => {
    setUser(getSavedUser())
  }, [])

  useEffect(() => {
    setDropdownOpen(false)
    setFormType(null)
    setErrorMessage("")
    setSuccessMessage("")
  }, [location.pathname])

  const navButtonClass = useMemo(
    () =>
      `rounded-md px-3 py-2 text-sm font-medium transition ${
        isDark
          ? "hover:bg-slate-700"
          : "hover:bg-white/20"
      }`,
    [isDark]
  )

  const menuButtonClass = `w-full rounded px-3 py-2 text-left text-sm transition ${
    isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
  }`

  const inputClass = `w-full rounded border px-3 py-2 text-sm outline-none ${
    isDark
      ? "border-slate-600 bg-slate-800 text-white"
      : "border-slate-300 bg-white text-slate-900"
  }`

  const resetFeedback = () => {
    setErrorMessage("")
    setSuccessMessage("")
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetFeedback()
    setLoading(true)

    try {
      const endpoint = formType === "login" ? "/api/login" : "/api/register"
      const payload =
        formType === "login"
          ? {
              email: formData.email.trim(),
              password: formData.password,
            }
          : {
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password,
            }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data?.error || "İşlem başarısız oldu.")
        return
      }

      if (formType === "login") {
        saveUser(data)
        setUser(data)
        setDropdownOpen(false)
        setFormType(null)
        setSuccessMessage("Giriş başarılı.")
      } else {
        setSuccessMessage("Kayıt başarılı. Şimdi giriş yapabilirsiniz.")
        setFormType("login")
        setFormData((prev) => ({ ...prev, password: "" }))
      }
    } catch {
      setErrorMessage("Sunucuya bağlanılamadı.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeSavedUser()
    setUser(null)
    setDropdownOpen(false)
    setFormType(null)
    resetFeedback()
    navigate("/main")
  }

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full border-b shadow-sm ${
        isDark
          ? "border-slate-800 bg-slate-900 text-white"
          : "border-red-900/20 bg-red-800 text-white"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate("/main")} className={navButtonClass}>
            Oku
          </button>
          <button
            onClick={() => navigate("/statistics")}
            className={navButtonClass}
          >
            İstatistikler
          </button>
          <button
            onClick={() => navigate("/settings")}
            className={navButtonClass}
          >
            Ayarlar
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen((prev) => !prev)
              setFormType(null)
              resetFeedback()
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
              isDark
                ? "border-slate-600 bg-slate-800 text-white"
                : "border-white bg-white text-slate-900"
            }`}
            aria-label="Kullanıcı menüsü"
          >
            👤
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-xl border p-3 shadow-xl ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              {user ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm">
                    👋 Merhaba, <strong>{user.name}</strong>
                    <div className="mt-1 text-xs opacity-80">{user.email}</div>
                  </div>

                  <button
                    onClick={() => navigate("/statistics")}
                    className={menuButtonClass}
                  >
                    📊 İstatistikler
                  </button>
                  <button
                    onClick={() => navigate("/settings")}
                    className={menuButtonClass}
                  >
                    ⚙️ Ayarlar
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`${menuButtonClass} text-red-500`}
                  >
                    🚪 Çıkış Yap
                  </button>
                </div>
              ) : formType ? (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="text-sm font-semibold">
                    {formType === "login" ? "Giriş Yap" : "Üye Ol"}
                  </div>

                  {formType === "register" && (
                    <input
                      type="text"
                      placeholder="İsim"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={inputClass}
                      required
                    />
                  )}

                  <input
                    type="email"
                    placeholder="E-posta"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  />

                  <input
                    type="password"
                    placeholder="Şifre"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  />

                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}

                  {successMessage && (
                    <p className="text-sm text-emerald-500">{successMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading
                      ? "Bekleniyor..."
                      : formType === "login"
                      ? "Giriş Yap"
                      : "Üye Ol"}
                  </button>

                  <button
                    type="button"
                    className="w-full text-center text-xs text-blue-500 underline"
                    onClick={() => {
                      resetFeedback()
                      setFormType(formType === "login" ? "register" : "login")
                    }}
                  >
                    {formType === "login"
                      ? "Üye değil misin?"
                      : "Zaten hesabım var"}
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  {successMessage && (
                    <p className="text-sm text-emerald-500">{successMessage}</p>
                  )}

                  <button
                    onClick={() => {
                      setFormType("login")
                      resetFeedback()
                    }}
                    className={menuButtonClass}
                  >
                    📥 Giriş Yap
                  </button>

                  <button
                    onClick={() => {
                      setFormType("register")
                      resetFeedback()
                    }}
                    className={menuButtonClass}
                  >
                    📝 Üye Ol
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}