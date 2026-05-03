type Surah = {
  no: number
  ad: string
  ayetSayisi: number
}

type ReadVersesMap = Record<number, number[]>
type CompletedSurahCounts = Record<number, number>
type StatMode = "ayet" | "harf"
type VerseTextMap = Record<string, string>

type ChartItem = {
  name: string
  value: number
}

type DetailItem = {
  sure: string
  ranges: string[]
  verseCount: number
  letterCount: number
}

type TopSurahItem = {
  name: string
  value: number
}

type StatisticsResult = {
  mode: StatMode
  totalReadValue: number
  totalReadVerses: number
  totalReadLetters: number
  startedSurahCount: number
  completedSurahCount: number
  completionPercent: number
  chartData: ChartItem[]
  details: DetailItem[]
  topSurahs: TopSurahItem[]
}

function buildRanges(sorted: number[]): string[] {
  if (sorted.length === 0) return []

  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
      start = sorted[i]
      prev = sorted[i]
    }
  }

  ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
  return ranges
}

export function countArabicLetters(text: string): number {
  const normalized = text.normalize("NFC")

  return Array.from(normalized).filter((char) =>
    /[\u0621-\u063A\u0641-\u064A]/.test(char)
  ).length
}

function getVerseLetterCount(
  surahNo: number,
  ayahNo: number,
  verseTextMap: VerseTextMap
): number {
  const text = verseTextMap[`${surahNo}-${ayahNo}`] || ""
  return countArabicLetters(text)
}

function getTotalQuranLetters(
  surahs: Surah[],
  verseTextMap: VerseTextMap
): number {
  let total = 0

  for (const surah of surahs) {
    for (let ayahNo = 1; ayahNo <= surah.ayetSayisi; ayahNo++) {
      total += getVerseLetterCount(surah.no, ayahNo, verseTextMap)
    }
  }

  return total
}

export function buildStatistics(
  readVerses: ReadVersesMap,
  surahs: Surah[],
  mode: StatMode,
  verseTextMap: VerseTextMap = {},
  completedSurahCounts: CompletedSurahCounts = {}
): StatisticsResult {
  const chartData: ChartItem[] = []
  const details: DetailItem[] = []

  let totalReadVerses = 0
  let totalReadLetters = 0
  let startedSurahCount = 0
  let completedSurahCount = 0

  const totalQuranVerses = surahs.reduce(
    (sum, surah) => sum + surah.ayetSayisi,
    0
  )

  const totalQuranLetters =
    mode === "harf" ? getTotalQuranLetters(surahs, verseTextMap) : 0

  for (const surah of surahs) {
    const ayetList = [...new Set(readVerses[surah.no] || [])].sort(
      (a, b) => a - b
    )

    if (ayetList.length === 0) continue

    startedSurahCount += 1
    totalReadVerses += ayetList.length

    if (ayetList.length >= surah.ayetSayisi) {
      completedSurahCount += 1
    }

    let surahLetterCount = 0

    for (const ayahNo of ayetList) {
      surahLetterCount += getVerseLetterCount(
        surah.no,
        ayahNo,
        verseTextMap
      )
    }

    totalReadLetters += surahLetterCount

    chartData.push({
      name: surah.ad,
      value: mode === "harf" ? surahLetterCount : ayetList.length,
    })

    details.push({
      sure: surah.ad,
      ranges: buildRanges(ayetList),
      verseCount: ayetList.length,
      letterCount: surahLetterCount,
    })
  }

  const totalReadValue = mode === "harf" ? totalReadLetters : totalReadVerses
  const totalBaseValue = mode === "harf" ? totalQuranLetters : totalQuranVerses

  const completionPercent =
    totalBaseValue === 0
      ? 0
      : Number(((totalReadValue / totalBaseValue) * 100).toFixed(2))

  const topSurahs = surahs
    .map((surah) => ({
      name: surah.ad,
      value: completedSurahCounts[surah.no] || 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return {
    mode,
    totalReadValue,
    totalReadVerses,
    totalReadLetters,
    startedSurahCount,
    completedSurahCount,
    completionPercent,
    chartData,
    details,
    topSurahs,
  }
}