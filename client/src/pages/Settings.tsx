import { useEffect, useState } from "react"
import {
  clearReadingProgress,
  getAppSettings,
  saveAppSettings,
  type AppSettings,
} from "../utils/storage"

export default function Settings() {
  const initialSettings = getAppSettings()

  const [tema, setTema] = useState<AppSettings["tema"]>(initialSettings.tema)
  const [fontSize, setFontSize] = useState<AppSettings["fontSize"]>(
    initialSettings.fontSize
  )
  const [bildirimler, setBildirimler] = useState(initialSettings.bildirimler)
  const [istatistikTuru, setIstatistikTuru] =
    useState<AppSettings["istatistikTuru"]>(initialSettings.istatistikTuru)

  const [resetMessage, setResetMessage] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    saveAppSettings({
      tema,
      fontSize,
      bildirimler,
      istatistikTuru,
    })
  }, [tema, fontSize, bildirimler, istatistikTuru])

  const isDark = tema === "dark"

  const cardClass = `mx-auto mt-6 max-w-xl rounded-2xl border p-6 shadow-sm ${
    isDark
      ? "border-slate-800 bg-slate-900 text-white"
      : "border-slate-200 bg-white text-slate-900"
  }`

  const selectClass = `w-full rounded-lg border px-3 py-2 ${
    isDark
      ? "border-slate-700 bg-slate-950 text-white"
      : "border-slate-300 bg-white text-slate-900"
  }`

  const handleReset = () => {
    clearReadingProgress()
    setResetMessage("Okuma geçmişi sıfırlandı.")
    setTimeout(() => setResetMessage(""), 3000)
  }

  const handleSaveClick = () => {
    saveAppSettings({
      tema,
      fontSize,
      bildirimler,
      istatistikTuru,
    })
    setSaveMessage("Ayarlar kaydedildi.")
    setTimeout(() => setSaveMessage(""), 3000)
  }

  return (
    <div className={cardClass}>
      <h1 className="mb-6 text-2xl font-bold text-blue-500">Ayarlar</h1>

      <div className="mb-4">
        <label className="mb-1 block font-medium">Tema</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value as AppSettings["tema"])}
          className={selectClass}
        >
          <option value="light">Açık Tema</option>
          <option value="dark">Koyu Tema</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-medium">Yazı Boyutu</label>
        <select
          value={fontSize}
          onChange={(e) =>
            setFontSize(e.target.value as AppSettings["fontSize"])
          }
          className={selectClass}
        >
          <option value="small">Küçük</option>
          <option value="normal">Normal</option>
          <option value="large">Büyük</option>
        </select>
      </div>

      <div className="mb-4 flex items-center">
        <input
          id="bildirimler"
          type="checkbox"
          checked={bildirimler}
          onChange={(e) => setBildirimler(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="bildirimler" className="font-medium">
          Okuma hatırlatmalarını al
        </label>
      </div>

      <div className="mb-6">
        <label className="mb-1 block font-medium">İstatistik Türü</label>
        <select
          value={istatistikTuru}
          onChange={(e) =>
            setIstatistikTuru(e.target.value as AppSettings["istatistikTuru"])
          }
          className={selectClass}
        >
          <option value="ayet">Ayet Bazlı</option>
          <option value="harf">Harf Bazlı</option>
        </select>
        <p className="mt-2 text-sm opacity-75">
          Harf bazlı sayımda boşluklar, harekeler ve işaretler dahil edilmez.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleSaveClick}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Ayarları Kaydet
        </button>

        <button
          onClick={handleReset}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Okuma Geçmişini Sıfırla
        </button>
      </div>

      {resetMessage && (
        <p className="mt-4 font-medium text-green-500">{resetMessage}</p>
      )}
      {saveMessage && (
        <p className="mt-4 font-medium text-blue-500">{saveMessage}</p>
      )}
    </div>
  )
}