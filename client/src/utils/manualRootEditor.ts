import { manualRootMap } from "../data/manualRootMap"

const STORAGE_KEY = "manualRootMapDraft"

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim()
}

function getDraftMap(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}

export function getManualRootMap() {
  return {
    ...manualRootMap,
    ...getDraftMap(),
  }
}

export function findManualRoot(word: string) {
  const bareWord = normalizeArabic(word)
  const map = getManualRootMap()

  for (const [root, words] of Object.entries(map)) {
    if (words.map(normalizeArabic).includes(bareWord)) {
      return root
    }
  }

  return null
}

export function addManualRoot(word: string, root: string) {
  const bareWord = normalizeArabic(word)
  const bareRoot = normalizeArabic(root)

  if (!bareWord || !bareRoot) return

  const draftMap = getDraftMap()
  const words = draftMap[bareRoot] || []

  if (!words.includes(bareWord)) {
    draftMap[bareRoot] = [...words, bareWord]
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(draftMap))
  window.dispatchEvent(new Event("manualRootMapUpdated"))
}

export function exportManualRootMap() {
  const map = getManualRootMap()

  const content = `export const manualRootMap: Record<string, string[]> = ${JSON.stringify(
    map,
    null,
    2
  )}
`

  const blob = new Blob([content], { type: "text/typescript;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "manualRootMap.ts"
  a.click()

  URL.revokeObjectURL(url)
}

declare global {
  interface Window {
    exportManualRootMap: typeof exportManualRootMap
  }
}

window.exportManualRootMap = exportManualRootMap