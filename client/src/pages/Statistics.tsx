import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { surahs } from "../data/surahs"
import {
  getAppSettings,
  getCompletedSurahCounts,
  getReadVerses,
} from "../utils/storage"
import { buildStatistics } from "../utils/stats"

type VerseTextMap = Record<string, string>

export default function StatisticsPage() {
  const settings = getAppSettings()
  const isDark = settings.tema === "dark"

  const [verseMap, setVerseMap] = useState<VerseTextMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadQuranText = async () => {
      try {
        setLoading(true)

        const response = await fetch("/quran-simple-plain.txt")
        const text = await response.text()

        if (cancelled) return

        const lines = text
          .split("\n")
          .map((line) => line.trim().replace(/^\uFEFF/, ""))
          .filter(Boolean)

        const nextMap: VerseTextMap = {}

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
          setLoading(false)
        }
      }
    }

    loadQuranText()

    return () => {
      cancelled = true
    }
  }, [])

  const readVerses = getReadVerses()
  const completedSurahCounts = getCompletedSurahCounts()

  const stats = buildStatistics(
    readVerses,
    surahs,
    settings.istatistikTuru,
    verseMap,
    completedSurahCounts
  )

  const unitLabel = settings.istatistikTuru === "harf" ? "harf" : "ayet"
  const totalReadLabel =
    settings.istatistikTuru === "harf"
      ? "Toplam Okunan Harf"
      : "Toplam Okunan Ayet"

  return (
    <div className="mx-auto mt-8 max-w-6xl px-4">
      <h1 className="mb-2 text-3xl font-bold">Okuma İstatistikleri</h1>
      <p className="mb-6 text-sm opacity-70">
        Aktif mod:{" "}
        <strong>
          {settings.istatistikTuru === "harf" ? "Harf Bazlı" : "Ayet Bazlı"}
        </strong>
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-sm opacity-70">{totalReadLabel}</p>
          <p className="mt-2 text-3xl font-bold">{stats.totalReadValue}</p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-sm opacity-70">Başlanan Sure</p>
          <p className="mt-2 text-3xl font-bold">{stats.startedSurahCount}</p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-sm opacity-70">Tamamlanan Sure</p>
          <p className="mt-2 text-3xl font-bold">{stats.completedSurahCount}</p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-sm opacity-70">Genel İlerleme</p>
          <p className="mt-2 text-3xl font-bold">%{stats.completionPercent}</p>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 shadow-sm ${
          isDark
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <h2 className="mb-4 text-xl font-semibold">
          Sure Bazlı Okuma Grafiği
        </h2>

        {loading ? (
          <p className="py-10 text-center opacity-70">
            İstatistik verileri yükleniyor...
          </p>
        ) : stats.chartData.length === 0 ? (
          <p className="py-10 text-center opacity-70">
            Henüz okunmuş veri yok.
          </p>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.chartData}
                margin={{ top: 10, right: 20, bottom: 50, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} ${unitLabel}`,
                    unitLabel,
                  ]}
                />
                <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2 className="mb-4 text-xl font-semibold">Detaylı Okuma Aralıkları</h2>

          {loading ? (
            <p className="opacity-70">Detaylar yükleniyor...</p>
          ) : stats.details.length === 0 ? (
            <p className="opacity-70">Henüz detay verisi yok.</p>
          ) : (
            <ul className="space-y-3">
              {stats.details.map((item) => (
                <li
                  key={item.sure}
                  className={`rounded-lg border p-3 ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <div className="mb-1">
                    <strong>{item.sure}</strong>
                  </div>
                  <div className="text-sm opacity-80">
                    Aralıklar: {item.ranges.join(", ")}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="mr-4">
                      <strong>Ayet:</strong> {item.verseCount}
                    </span>
                    <span>
                      <strong>Harf:</strong> {item.letterCount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2 className="mb-4 text-xl font-semibold">
            En Çok Tamamlanan Sureler
          </h2>

          {loading ? (
            <p className="opacity-70">Liste yükleniyor...</p>
          ) : stats.topSurahs.length === 0 ? (
            <p className="opacity-70">Henüz tamamlanan sure verisi yok.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topSurahs.map((item, index) => (
                <li
                  key={item.name}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <span>
                    {index + 1}. {item.name}
                  </span>
                  <strong>{item.value} kez</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}