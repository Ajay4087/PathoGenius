import { getTemplate, TEST_CATEGORIES } from '../data/templates.ts'
import type {
  ActiveTest,
  Gender,
  ParameterDef,
  ParameterValue,
  PrintSettings,
  ResultFlag,
  TestKind,
  WidalCell,
} from '../types/report.types.ts'
import { MM_TO_PX } from '../types/report.types.ts'
import { presentParameter, summarizeDlc, type DlcSummary, widalInterpretation } from './calculations.ts'

export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123

export const CHROME = {
  header: 96,
  footer: 72,
  patient: 88,
  continuation: 28,
  pageNumber: 16,
  pad: 20,
} as const

export const BLOCK = {
  section: 32,
  group: 22,
  head: 26,
  row: 26,
  dlc: 22,
  widal: 176,
  note: 58,
} as const

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX)
}

export interface PageChrome {
  topPad: number
  bottomPad: number
  showHeader: boolean
  showFooter: boolean
  showPatient: boolean
  showContinuation: boolean
  contentHeight: number
}

export function pageChrome(settings: PrintSettings, pageIndex: number): PageChrome {
  const topPad = settings.letterheadMode ? mmToPx(settings.topMarginMm) : CHROME.pad
  const bottomPad = settings.letterheadMode ? mmToPx(settings.bottomMarginMm) : CHROME.pad
  const showHeader = !settings.letterheadMode && settings.showHeader
  const showFooter = !settings.letterheadMode && settings.showFooter
  const showPatient = pageIndex === 0
  const showContinuation = pageIndex > 0
  let contentHeight = A4_HEIGHT_PX - topPad - bottomPad - CHROME.pageNumber
  if (showHeader) contentHeight -= CHROME.header
  if (showFooter) contentHeight -= CHROME.footer
  if (showPatient) contentHeight -= CHROME.patient
  if (showContinuation) contentHeight -= CHROME.continuation
  return {
    topPad,
    bottomPad,
    showHeader,
    showFooter,
    showPatient,
    showContinuation,
    contentHeight: Math.max(48, contentHeight),
  }
}

export interface StandardRowView {
  key: string
  name: string
  result: string
  unit: string
  rangeLabel: string
  flag: ResultFlag
  hasValue: boolean
}

export interface SectionGroup {
  name: string | null
  rows: StandardRowView[]
}

export interface SectionView {
  key: string
  title: string
  category: string
  kind: TestKind
  groups: SectionGroup[]
  dlc: DlcSummary | null
  widal: WidalCell[] | null
  note: string | null
}

export type Block =
  | { type: 'section-header'; height: number; title: string; category: string; continued: boolean; key: string }
  | { type: 'group'; height: number; name: string; key: string }
  | { type: 'table-head'; height: number; key: string }
  | { type: 'row'; height: number; row: StandardRowView; key: string }
  | { type: 'dlc'; height: number; summary: DlcSummary; key: string }
  | { type: 'widal'; height: number; cells: WidalCell[]; key: string }
  | { type: 'note'; height: number; text: string; key: string }

export interface ReportPage {
  index: number
  blocks: Block[]
}

function valueOf(values: readonly ParameterValue[], id: string): number | null {
  return values.find((entry) => entry.id === id)?.value ?? null
}

function sectionNote(templateId: string, values: readonly ParameterValue[], fallback: string | undefined, widalNote: string | null): string | null {
  if (widalNote) return widalNote
  if (templateId === 'lft') {
    const total = valueOf(values, 'tbil')
    const direct = valueOf(values, 'dbil')
    if (total != null && direct != null && direct > total) {
      return 'Direct bilirubin is higher than total bilirubin. Check both entries.'
    }
  }
  if (templateId === 'lipid') {
    const triglycerides = valueOf(values, 'tg')
    if (triglycerides != null && triglycerides >= 400) {
      return 'Triglycerides are 400 mg/dL or higher. Friedewald LDL and VLDL are not calculated.'
    }
  }
  return fallback ?? null
}

function buildSections(tests: readonly ActiveTest[], gender: Gender, settings: PrintSettings): SectionView[] {
  const ordered = tests
    .map((test, index) => ({ test, index }))
    .sort((left, right) => {
      const leftTemplate = getTemplate(left.test.templateId)
      const rightTemplate = getTemplate(right.test.templateId)
      const leftRank = leftTemplate ? TEST_CATEGORIES.indexOf(leftTemplate.category) : 99
      const rightRank = rightTemplate ? TEST_CATEGORIES.indexOf(rightTemplate.category) : 99
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.index - right.index
    })

  const sections: SectionView[] = []
  for (const item of ordered) {
    const template = getTemplate(item.test.templateId)
    if (!template) continue
    const groups: SectionGroup[] = []
    for (const parameter of template.parameters) {
      const entry = item.test.values.find((value) => value.id === parameter.id)
      const numeric = entry?.value ?? null
      const presented = presentParameter(parameter, numeric, gender, settings.unitSystem)
      const row: StandardRowView = {
        key: `${item.test.instanceId}-${parameter.id}`,
        name: parameter.name,
        result: presented.result,
        unit: presented.unit,
        rangeLabel: presented.rangeLabel,
        flag: entry?.flag ?? 'Normal',
        hasValue: numeric != null,
      }
      const groupName = parameter.group ?? null
      const last = groups[groups.length - 1]
      if (last && last.name === groupName) last.rows.push(row)
      else groups.push({ name: groupName, rows: [row] })
    }

    const dlcParameters = template.parameters.filter((parameter) => parameter.isDlc)
    const dlc =
      dlcParameters.length > 0
        ? summarizeDlc(dlcParameters.map((parameter) => ({ value: valueOf(item.test.values, parameter.id) })))
        : null
    const widal = template.kind === 'widal' ? item.test.widal : null
    const dynamicNote = widal ? `${widalInterpretation(widal)} ${template.interpretation ?? ''}`.trim() : null
    sections.push({
      key: item.test.instanceId,
      title: template.name,
      category: template.category,
      kind: template.kind,
      groups,
      dlc,
      widal,
      note: sectionNote(template.id, item.test.values, template.interpretation, dynamicNote),
    })
  }
  return sections
}

function sectionToBlocks(section: SectionView): Block[] {
  const blocks: Block[] = [
    {
      type: 'section-header',
      height: BLOCK.section,
      title: section.title,
      category: section.category,
      continued: false,
      key: `${section.key}-title`,
    },
  ]
  if (section.kind === 'widal' && section.widal) {
    blocks.push({ type: 'widal', height: BLOCK.widal, cells: section.widal, key: `${section.key}-widal` })
  } else {
    let headed = false
    for (const group of section.groups) {
      if (!headed) {
        blocks.push({ type: 'table-head', height: BLOCK.head, key: `${section.key}-head` })
        headed = true
      }
      if (group.name) {
        blocks.push({ type: 'group', height: BLOCK.group, name: group.name, key: `${section.key}-g-${group.name}` })
      }
      for (const row of group.rows) {
        blocks.push({ type: 'row', height: BLOCK.row, row, key: row.key })
      }
    }
  }
  if (section.dlc && section.dlc.entered > 0 && !section.dlc.balanced) {
    blocks.push({ type: 'dlc', height: BLOCK.dlc, summary: section.dlc, key: `${section.key}-dlc` })
  }
  if (section.note) {
    blocks.push({ type: 'note', height: BLOCK.note, text: section.note, key: `${section.key}-note` })
  }
  return blocks
}

function isChrome(block: Block): boolean {
  return block.type === 'section-header' || block.type === 'table-head' || block.type === 'group'
}

function paginate(blocks: readonly Block[], settings: PrintSettings): ReportPage[] {
  if (blocks.length === 0) return [{ index: 0, blocks: [] }]

  const pages: ReportPage[] = []
  let current: Block[] = []
  let used = 0
  let activeTitle = ''
  let activeCategory = ''
  let activeKey = 'section'

  const limit = () => pageChrome(settings, pages.length).contentHeight

  const flush = () => {
    pages.push({ index: pages.length, blocks: current })
    current = []
    used = 0
  }

  const pushBlock = (block: Block) => {
    current.push(block)
    used += block.height
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (!block) continue
    if (block.type === 'section-header' && !block.continued) {
      activeTitle = block.title
      activeCategory = block.category
      activeKey = block.key
    }
    const next = blocks[index + 1]
    const sticks = block.type === 'section-header' || block.type === 'table-head' || block.type === 'group'
    const pairOverflow = Boolean(sticks && next && current.length > 0 && used + block.height + next.height > limit())
    const overflows = current.length > 0 && used + block.height > limit()

    if (overflows || pairOverflow) {
      const detached: Block[] = []
      while (current.length > 0) {
        const tail = current[current.length - 1]
        if (!tail || !isChrome(tail)) break
        detached.unshift(tail)
        current.pop()
        used -= tail.height
      }
      if (current.length === 0) {
        current = detached
        used = detached.reduce((sum, item) => sum + item.height, 0)
      } else {
        flush()
        if (detached.length > 0) {
          for (const item of detached) pushBlock(item)
        } else if (block.type !== 'section-header' && block.type !== 'widal' && activeTitle) {
          pushBlock({
            type: 'section-header',
            height: BLOCK.section,
            title: activeTitle,
            category: activeCategory,
            continued: true,
            key: `${activeKey}-cont-${pages.length}`,
          })
          if (block.type === 'row' || block.type === 'group') {
            pushBlock({ type: 'table-head', height: BLOCK.head, key: `${activeKey}-head-${pages.length}` })
          }
        }
      }
    }

    pushBlock(block)
  }

  if (current.length > 0) flush()
  return pages
}

export function buildReportPages(tests: readonly ActiveTest[], gender: Gender, settings: PrintSettings): ReportPage[] {
  const sections = buildSections(tests, gender, settings)
  return paginate(sections.flatMap(sectionToBlocks), settings)
}

export function findDlcWarning(tests: readonly ActiveTest[]): string | null {
  for (const test of tests) {
    const template = getTemplate(test.templateId)
    if (!template) continue
    const dlcParameters: ParameterDef[] = template.parameters.filter((parameter) => parameter.isDlc)
    if (dlcParameters.length === 0) continue
    const summary = summarizeDlc(dlcParameters.map((parameter) => ({ value: valueOf(test.values, parameter.id) })))
    if (summary.entered > 0 && !summary.balanced) return `${template.shortName}: ${summary.message}`
  }
  return null
}
