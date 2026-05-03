export type User = {
  id: string
  name: string
  email: string
}

export type AppSettings = {
  tema: "light" | "dark"
  fontSize: "small" | "normal" | "large"
  bildirimler: boolean
  istatistikTuru: "ayet" | "harf"
}

export type ReadVersesMap = Record<number, number[]>
export type CompletedSurahCounts = Record<number, number>

type LastReadingPosition = {
  sureNo: number
  ayetNo: number
}

const STORAGE_KEYS = {
  user: "user",
  appSettings: "appSettings",
  readVerses: "readVerses",
  lastSelectedSureNo: "lastSelectedSureNo",
  lastSelectedAyet: "lastSelectedAyet",
  completedSurahCounts: "completedSurahCounts",
  completedSurahSessions: "completedSurahSessions",
} as const

const defaultSettings: AppSettings = {
  tema: "light",
  fontSize: "normal",
  bildirimler: true,
  istatistikTuru: "ayet",
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function getSavedUser(): User | null {
  return safeJsonParse<User | null>(
    localStorage.getItem(STORAGE_KEYS.user),
    null
  )
}

export function saveUser(user: User) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function removeSavedUser() {
  localStorage.removeItem(STORAGE_KEYS.user)
}

export function getAppSettings(): AppSettings {
  const saved = safeJsonParse<Partial<AppSettings>>(
    localStorage.getItem(STORAGE_KEYS.appSettings),
    {}
  )

  return {
    tema: saved.tema ?? defaultSettings.tema,
    fontSize: saved.fontSize ?? defaultSettings.fontSize,
    bildirimler: saved.bildirimler ?? defaultSettings.bildirimler,
    istatistikTuru: saved.istatistikTuru ?? defaultSettings.istatistikTuru,
  }
}

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.appSettings, JSON.stringify(settings))
}

export function getReadVerses(): ReadVersesMap {
  const raw = safeJsonParse<Record<string, unknown>>(
    localStorage.getItem(STORAGE_KEYS.readVerses),
    {}
  )

  const normalized: ReadVersesMap = {}

  for (const key of Object.keys(raw)) {
    const sureNo = Number(key)
    const value = raw[key]

    if (!Number.isFinite(sureNo) || !Array.isArray(value)) continue

    normalized[sureNo] = value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
      .sort((a, b) => a - b)
  }

  return normalized
}

export function saveReadVerses(data: ReadVersesMap) {
  localStorage.setItem(STORAGE_KEYS.readVerses, JSON.stringify(data))
}

export function markVerseAsRead(sureNo: number, ayetNo: number) {
  const readMap = getReadVerses()
  const currentList = readMap[sureNo] || []

  if (currentList.includes(ayetNo)) return

  const updated = [...currentList, ayetNo].sort((a, b) => a - b)
  readMap[sureNo] = updated
  saveReadVerses(readMap)
}

export function getLastReadingPosition(): LastReadingPosition {
  const sureNo = Number(
    localStorage.getItem(STORAGE_KEYS.lastSelectedSureNo) || 1
  )
  const ayetNo = Number(
    localStorage.getItem(STORAGE_KEYS.lastSelectedAyet) || 1
  )

  return {
    sureNo: Number.isFinite(sureNo) && sureNo > 0 ? sureNo : 1,
    ayetNo: Number.isFinite(ayetNo) && ayetNo > 0 ? ayetNo : 1,
  }
}

export function saveLastReadingPosition(sureNo: number, ayetNo: number) {
  localStorage.setItem(STORAGE_KEYS.lastSelectedSureNo, String(sureNo))
  localStorage.setItem(STORAGE_KEYS.lastSelectedAyet, String(ayetNo))
}

export function getCompletedSurahCounts(): CompletedSurahCounts {
  const raw = safeJsonParse<Record<string, unknown>>(
    localStorage.getItem(STORAGE_KEYS.completedSurahCounts),
    {}
  )

  const normalized: CompletedSurahCounts = {}

  for (const key of Object.keys(raw)) {
    const sureNo = Number(key)
    const value = Number(raw[key])

    if (!Number.isFinite(sureNo) || !Number.isFinite(value)) continue
    normalized[sureNo] = value
  }

  return normalized
}

export function saveCompletedSurahCounts(data: CompletedSurahCounts) {
  localStorage.setItem(
    STORAGE_KEYS.completedSurahCounts,
    JSON.stringify(data)
  )
}

export function getCompletedSurahSessions(): string[] {
  return safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.completedSurahSessions),
    []
  )
}

export function saveCompletedSurahSessions(data: string[]) {
  localStorage.setItem(
    STORAGE_KEYS.completedSurahSessions,
    JSON.stringify(data)
  )
}

function getActiveSurahSessionKey(sureNo: number): string {
  return `activeSurahSession_${sureNo}`
}

export function startSurahSessionIfNeeded(sureNo: number) {
  const key = getActiveSurahSessionKey(sureNo)
  const existing = localStorage.getItem(key)

  if (!existing) {
    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${sureNo}-${Date.now()}-${Math.random()}`
    localStorage.setItem(key, sessionId)
  }
}

export function completeSurahSession(
  sureNo: number,
  ayetNo: number,
  totalAyet: number
) {
  if (ayetNo !== totalAyet) return

  const activeKey = getActiveSurahSessionKey(sureNo)
  const sessionId = localStorage.getItem(activeKey)

  if (!sessionId) return

  const completedSessions = getCompletedSurahSessions()
  const completionKey = `${sureNo}:${sessionId}`

  if (completedSessions.includes(completionKey)) return

  const counts = getCompletedSurahCounts()
  counts[sureNo] = (counts[sureNo] || 0) + 1

  saveCompletedSurahCounts(counts)
  saveCompletedSurahSessions([...completedSessions, completionKey])

  localStorage.removeItem(activeKey)
}

export function clearReadingProgress() {
  localStorage.removeItem(STORAGE_KEYS.readVerses)
  localStorage.removeItem(STORAGE_KEYS.lastSelectedSureNo)
  localStorage.removeItem(STORAGE_KEYS.lastSelectedAyet)
  localStorage.removeItem(STORAGE_KEYS.completedSurahCounts)
  localStorage.removeItem(STORAGE_KEYS.completedSurahSessions)

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith("activeSurahSession_")) {
      localStorage.removeItem(key)
    }
  }
}