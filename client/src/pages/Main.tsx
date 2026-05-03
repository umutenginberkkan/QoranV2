import { useEffect, useMemo, useState } from "react"
import { surahs } from "../data/surahs"
import {
  completeSurahSession,
  getAppSettings,
  getLastReadingPosition,
  getReadVerses,
  markVerseAsRead,
  saveLastReadingPosition,
  startSurahSessionIfNeeded,
} from "../utils/storage"
import { addManualRoot, findManualRoot } from "../utils/manualRootEditor"
import mufredatKokSayfaIndex from "../data/mufredatKokSayfaIndex"

type QuranLineMap = Record<string, string>

type PopupState = {
  page: number
  root: string
  word: string
} | null

function buildMufredatPageSrc(page: number) {
  return `/books/mufredat/jpg/${String(page - 1).padStart(4, "0")}.jpg`
}


function BookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export default function Main() {
  const settings = getAppSettings()
  const isDark = settings.tema === "dark"

  const [selectedSure, setSelectedSure] = useState(() => {
    const { sureNo } = getLastReadingPosition()
    return surahs.find((s) => s.no === sureNo) || surahs[0]
  })

  const [selectedAyet, setSelectedAyet] = useState(() => {
    const { ayetNo } = getLastReadingPosition()
    return ayetNo
  })

  const [verseMap, setVerseMap] = useState<QuranLineMap>({})
  const [ayetMetni, setAyetMetni] = useState("")
  const [wasReadBefore, setWasReadBefore] = useState(false)
  const [loadingText, setLoadingText] = useState(true)
  const [popup, setPopup] = useState<PopupState>(null)
  const [manualRootVersion, setManualRootVersion] = useState(0)

  const imageSrc = `/img/${selectedSure.no}_${selectedAyet}.png`

  const fontSizeClass = useMemo(() => {
    if (settings.fontSize === "small") return "text-2xl"
    if (settings.fontSize === "large") return "text-4xl"
    return "text-3xl"
  }, [settings.fontSize])

  const wordRows = useMemo(() => {
    return ayetMetni
      .split(/\s+/)
      .map((kelime) => kelime.trim())
      .filter(Boolean)
      .map((word) => {
        const root = findManualRoot(word)
        const pages = root ? mufredatKokSayfaIndex[root] : null

        return {
          word,
          match: root && pages ? { root, pages } : null,
          root,
        }
      })
  }, [ayetMetni, manualRootVersion])

  useEffect(() => {
    const handleManualRootUpdate = () => {
      setManualRootVersion((prev) => prev + 1)
    }

    window.addEventListener("manualRootMapUpdated", handleManualRootUpdate)

    return () => {
      window.removeEventListener("manualRootMapUpdated", handleManualRootUpdate)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadQuranText = async () => {
      try {
        setLoadingText(true)

        const response = await fetch("/quran-simple-plain.txt")
        const text = await response.text()

        if (cancelled) return

        const lines = text
          .split("\n")
          .map((line) => line.trim().replace(/^\uFEFF/, ""))
          .filter(Boolean)

        const nextMap: QuranLineMap = {}

        for (const line of lines) {
          const [sureStr, ayetStr, verseText] = line.split("|")
          if (!sureStr || !ayetStr || !verseText) continue
          nextMap[`${sureStr}-${ayetStr}`] = verseText
        }

        setVerseMap(nextMap)
      } catch {
        setVerseMap({})
      } finally {
        if (!cancelled) {
          setLoadingText(false)
        }
      }
    }

    loadQuranText()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const verseText = verseMap[`${selectedSure.no}-${selectedAyet}`] || ""
    setAyetMetni(verseText)

    const readMap = getReadVerses()
    const wasRead = (readMap[selectedSure.no] || []).includes(selectedAyet)
    setWasReadBefore(wasRead)

    if (verseText) {
      markVerseAsRead(selectedSure.no, selectedAyet)
    }

    saveLastReadingPosition(selectedSure.no, selectedAyet)
  }, [selectedSure, selectedAyet, verseMap])

  useEffect(() => {
    startSurahSessionIfNeeded(selectedSure.no)

    if (selectedAyet === selectedSure.ayetSayisi) {
      completeSurahSession(
        selectedSure.no,
        selectedAyet,
        selectedSure.ayetSayisi
      )
    }
  }, [selectedSure.no, selectedSure.ayetSayisi, selectedAyet])

  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let isPinching = false

    const goPrevAyet = () => {
      setSelectedAyet((prev) => (prev > 1 ? prev - 1 : prev))
    }

    const goNextAyet = () => {
      setSelectedAyet((prev) =>
        prev < selectedSure.ayetSayisi ? prev + 1 : prev
      )
    }

    const goPrevSure = () => {
      const currentIndex = surahs.findIndex((s) => s.no === selectedSure.no)
      if (currentIndex > 0) {
        setSelectedSure(surahs[currentIndex - 1])
        setSelectedAyet(1)
      }
    }

    const goNextSure = () => {
      const currentIndex = surahs.findIndex((s) => s.no === selectedSure.no)
      if (currentIndex < surahs.length - 1) {
        setSelectedSure(surahs[currentIndex + 1])
        setSelectedAyet(1)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        isPinching = true
        return
      }

      isPinching = false
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinching || e.changedTouches.length > 1) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          goPrevAyet()
        } else {
          goNextAyet()
        }
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (popup) {
        if (e.key === "Escape") setPopup(null)
        return
      }

      if (e.key === "ArrowRight") goNextAyet()
      if (e.key === "ArrowLeft") goPrevAyet()
      if (e.key === "ArrowUp") goPrevSure()
      if (e.key === "ArrowDown") goNextSure()
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKey)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKey)
    }
  }, [selectedSure, popup])

  useEffect(() => {
    if (!popup) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [popup])

  const continueFromLast = () => {
    const { sureNo, ayetNo } = getLastReadingPosition()
    const sure = surahs.find((s) => s.no === sureNo) || surahs[0]
    setSelectedSure(sure)
    setSelectedAyet(ayetNo)
  }

  const goToPreviousVerse = () => {
    if (selectedAyet > 1) {
      setSelectedAyet((prev) => prev - 1)
      return
    }

    const currentIndex = surahs.findIndex((s) => s.no === selectedSure.no)
    if (currentIndex > 0) {
      const previousSure = surahs[currentIndex - 1]
      setSelectedSure(previousSure)
      setSelectedAyet(previousSure.ayetSayisi)
    }
  }

  const goToNextVerse = () => {
    if (selectedAyet < selectedSure.ayetSayisi) {
      setSelectedAyet((prev) => prev + 1)
      return
    }

    const currentIndex = surahs.findIndex((s) => s.no === selectedSure.no)
    if (currentIndex < surahs.length - 1) {
      const nextSure = surahs[currentIndex + 1]
      setSelectedSure(nextSure)
      setSelectedAyet(1)
    }
  }

  return (
    <>
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <div
          className={`mb-6 rounded-2xl border p-4 shadow-sm ${isDark
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-slate-50"
            }`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <select
              className={`w-full rounded-lg border px-3 py-2 ${isDark
                ? "border-slate-700 bg-slate-950 text-white"
                : "border-slate-300 bg-white text-slate-900"
                }`}
              value={selectedSure.no}
              onChange={(e) => {
                const selectedNo = Number(e.target.value)
                const yeniSure =
                  surahs.find((s) => s.no === selectedNo) || surahs[0]
                setSelectedSure(yeniSure)
                setSelectedAyet(1)
              }}
            >
              {surahs.map((sure) => (
                <option key={sure.no} value={sure.no}>
                  {sure.no}. {sure.ad}
                </option>
              ))}
            </select>

            <select
              className={`w-full rounded-lg border px-3 py-2 ${isDark
                ? "border-slate-700 bg-slate-950 text-white"
                : "border-slate-300 bg-white text-slate-900"
                }`}
              value={selectedAyet}
              onChange={(e) => setSelectedAyet(Number(e.target.value))}
            >
              {Array.from({ length: selectedSure.ayetSayisi }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}. Ayet
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={goToPreviousVerse}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              Önceki
            </button>

            <button
              onClick={goToNextVerse}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Sonraki
            </button>

            <button
              onClick={continueFromLast}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              Son Kaldığım Yerden Devam Et
            </button>
          </div>
        </div>

        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold">
            {selectedSure.ad} - {selectedAyet}. Ayet
          </h1>
          <p className="mt-2 text-sm opacity-80">
            {wasReadBefore ? "Daha önce okunmuş" : "İlk kez görüntüleniyor"}
          </p>
        </div>

        <div className="flex justify-center">
          <img
            src={imageSrc}
            alt={`Ayet: ${selectedSure.ad} ${selectedAyet}`}
            className="w-full max-w-3xl rounded-xl border-2 border-gray-300 shadow-lg"
            onError={(e) => {
              e.currentTarget.src = "/img/not-found.png"
            }}
          />
        </div>

        <div
          className={`mt-6 rounded-2xl border p-6 text-center shadow-sm ${isDark
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white"
            }`}
        >
          <div className="mb-4">
            <span
              className={`inline-block h-4 w-4 rounded-full ${wasReadBefore ? "bg-green-500" : "bg-gray-400"
                }`}
              title={wasReadBefore ? "Okundu" : "İlk görüntüleme"}
            />
          </div>

          {loadingText ? (
            <p className="text-base opacity-80">Ayet metni yükleniyor...</p>
          ) : ayetMetni ? (
            <div
              className={`space-y-3 font-serif leading-loose ${fontSizeClass}`}
              dir="rtl"
            >
              {wordRows.map(({ word, match, root }, i) => {
                const hasSource = Boolean(match?.pages?.length)

                return (
                  <div
                    key={`${word}-${i}`}
                    className="relative flex items-center justify-center border-b border-current/20 pb-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (match && match.pages.length) {
                          setPopup({
                            page: match.pages[0],
                            root: match.root,
                            word,
                          })
                          return
                        }

                        if (root) {
                          alert(`${word} için kök zaten kayıtlı: ${root}\nAma bu kök için Müfredat sayfası bulunamadı.`)
                          return
                        }

                        const enteredRoot = prompt(`${word} kelimesi için kök gir:`)

                        if (!enteredRoot) return

                        addManualRoot(word, enteredRoot)
                      }}
                      title={
                        hasSource
                          ? `${word} → ${match?.root}`
                          : root
                            ? `${word} → ${root}, fakat sayfa bulunamadı`
                            : "Kök ekle"
                      }
                      aria-label={
                        hasSource
                          ? `${word} kelimesinin kök kaynağını aç`
                          : `${word} için kök ekle`
                      }
                      className={`absolute right-0 shrink-0 rounded-xl border p-2 transition ${hasSource
                        ? isDark
                          ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        : isDark
                          ? "border-amber-700 bg-amber-950 text-amber-200 hover:bg-amber-900"
                          : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                    >
                      <BookIcon className="h-5 w-5" />
                    </button>

                    <span className="text-center" dir="rtl">
                      {word}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-base text-red-500">Ayet metni bulunamadı.</p>
          )}
        </div>
      </div>

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 sm:p-6"
          onClick={() => setPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${popup.word} kelimesi için ${popup.root} kökü sayfası`}
        >
          <div
            className={`relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPopup(null)}
              aria-label="Kapat"
              className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/80"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div
              className={`shrink-0 border-b px-4 py-3 pr-16 ${isDark ? "border-slate-800" : "border-slate-200"
                }`}
            >
              <div className="grid grid-cols-3 items-center gap-2 text-sm sm:text-base">
                <div>
                  <div className="text-xs opacity-60">Sayfa</div>
                  <div className="font-semibold">{popup.page}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs opacity-60">Kök</div>
                  <div className="text-xl font-bold sm:text-2xl" dir="rtl">
                    {popup.root}
                  </div>
                </div>

                <div className="text-right pr-8 sm:pr-10">
                  <div className="text-xs opacity-60">Kelime</div>
                  <div className="text-lg font-semibold sm:text-xl" dir="rtl">
                    {popup.word}
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative min-h-0 flex-1 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() =>
                  setPopup((prev) =>
                    prev ? { ...prev, page: Math.max(1, prev.page - 1) } : prev
                  )
                }
                aria-label="Önceki Müfredat sayfası"
                className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-3xl font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:left-5 sm:h-14 sm:w-14"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() =>
                  setPopup((prev) => (prev ? { ...prev, page: prev.page + 1 } : prev))
                }
                aria-label="Sonraki Müfredat sayfası"
                className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-3xl font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:right-5 sm:h-14 sm:w-14"
              >
                ›
              </button>

              <div className="h-full overflow-auto p-2 sm:p-4">
                <img
                  key={popup.page}
                  src={buildMufredatPageSrc(popup.page)}
                  alt={`${popup.root} kökü için ${popup.page}. sayfa`}
                  className="mx-auto h-auto max-h-[calc(94vh-120px)] w-auto max-w-full rounded-xl bg-white object-contain shadow"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}