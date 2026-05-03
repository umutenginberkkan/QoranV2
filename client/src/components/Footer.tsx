import { useRef } from "react"
import { getAppSettings } from "../utils/storage"

const STORAGE_KEY = "manualRootMapDraft"

function downloadCurrentManualRootMap() {
  const currentMap = localStorage.getItem(STORAGE_KEY) || "{}"

  const blob = new Blob([currentMap], {
    type: "application/json;charset=utf-8",
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "manualRootMapDraft.json"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

async function uploadManualRootMap(file: File) {
  const text = await file.text()

  try {
    JSON.parse(text)
  } catch {
    alert("Geçersiz JSON dosyası.")
    return
  }

  localStorage.setItem(STORAGE_KEY, text)
  window.dispatchEvent(new Event("manualRootMapUpdated"))
  alert("Kök haritası yüklendi.")
}

export default function Footer() {
  const settings = getAppSettings()
  const isDark = settings.tema === "dark"
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <footer
      className={`mt-10 w-full border-t py-4 ${
        isDark
          ? "border-slate-800 bg-slate-900 text-slate-300"
          : "border-red-900/20 bg-red-800 text-white"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Kur’an Okuma Uygulaması</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={downloadCurrentManualRootMap}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border-white/40 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Kök Haritasını İndir
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                : "border-white/40 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Kök Haritası Yükle
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return

              await uploadManualRootMap(file)

              e.target.value = ""
            }}
          />

          <a href="#" className="hover:underline">
            Hakkında
          </a>

          <a href="#" className="hover:underline">
            Gizlilik
          </a>
        </div>
      </div>
    </footer>
  )
}