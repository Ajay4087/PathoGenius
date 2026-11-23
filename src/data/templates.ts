import type {
  ActiveTest,
  ParameterDef,
  ParameterValue,
  ReferenceRange,
  TestCategory,
  TestTemplate,
  WidalCell,
} from '../types/report.types.ts'
import { WIDAL_ANTIGENS, WIDAL_DILUTIONS } from '../types/report.types.ts'

export const TEST_CATEGORIES: readonly TestCategory[] = ['Haematology', 'Biochemistry', 'Serology']

export const DLC_GROUP = 'Differential Leucocyte Count'

const GLUCOSE_SI = { siUnit: 'mmol/L', toSi: 0.0555, siDecimals: 1 }
const BILI_SI = { siUnit: 'µmol/L', toSi: 17.104, siDecimals: 1 }
const CHOL_SI = { siUnit: 'mmol/L', toSi: 0.02586, siDecimals: 2 }
const TG_SI = { siUnit: 'mmol/L', toSi: 0.01129, siDecimals: 2 }

function range(
  gender: ReferenceRange['gender'],
  min: number | undefined,
  max: number | undefined,
  label: string,
): ReferenceRange {
  const next: ReferenceRange = { gender, label }
  if (min != null) next.min = min
  if (max != null) next.max = max
  return next
}

const cbcParameters: ParameterDef[] = [
  {
    id: 'hb',
    name: 'Hemoglobin',
    unit: 'g/dL',
    ranges: [
      range('Male', 13, 17, '13.0 – 17.0'),
      range('Female', 12, 15, '12.0 – 15.0'),
    ],
    sliderMin: 4,
    sliderMax: 20,
    step: 0.1,
    decimals: 1,
    conversion: { siUnit: 'g/L', toSi: 10, siDecimals: 0 },
  },
  {
    id: 'rbc',
    name: 'RBC Count',
    unit: 'mill/µL',
    ranges: [
      range('Male', 4.5, 5.5, '4.50 – 5.50'),
      range('Female', 3.8, 4.8, '3.80 – 4.80'),
    ],
    sliderMin: 1,
    sliderMax: 8,
    step: 0.01,
    decimals: 2,
  },
  {
    id: 'pcv',
    name: 'PCV / Hematocrit',
    unit: '%',
    ranges: [
      range('Male', 40, 50, '40.0 – 50.0'),
      range('Female', 36, 46, '36.0 – 46.0'),
    ],
    sliderMin: 15,
    sliderMax: 70,
    step: 0.1,
    decimals: 1,
  },
  {
    id: 'mcv',
    name: 'MCV',
    unit: 'fL',
    ranges: [range('All', 80, 100, '80.0 – 100.0')],
    sliderMin: 50,
    sliderMax: 140,
    step: 0.1,
    decimals: 1,
    derivedFrom: 'mcv',
  },
  {
    id: 'mch',
    name: 'MCH',
    unit: 'pg',
    ranges: [range('All', 27, 32, '27.0 – 32.0')],
    sliderMin: 15,
    sliderMax: 50,
    step: 0.1,
    decimals: 1,
    derivedFrom: 'mch',
  },
  {
    id: 'mchc',
    name: 'MCHC',
    unit: 'g/dL',
    ranges: [range('All', 32, 36, '32.0 – 36.0')],
    sliderMin: 25,
    sliderMax: 40,
    step: 0.1,
    decimals: 1,
    derivedFrom: 'mchc',
    conversion: { siUnit: 'g/L', toSi: 10, siDecimals: 0 },
  },
  {
    id: 'rdw',
    name: 'RDW-CV',
    unit: '%',
    ranges: [range('All', 11.5, 14.5, '11.5 – 14.5')],
    sliderMin: 10,
    sliderMax: 30,
    step: 0.1,
    decimals: 1,
  },
  {
    id: 'tlc',
    name: 'Total Leucocyte Count',
    unit: '/µL',
    ranges: [range('All', 4000, 11000, '4,000 – 11,000')],
    sliderMin: 1000,
    sliderMax: 50000,
    step: 100,
    decimals: 0,
  },
  {
    id: 'neut',
    name: 'Neutrophils',
    unit: '%',
    ranges: [range('All', 40, 75, '40 – 75')],
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    decimals: 0,
    group: DLC_GROUP,
    isDlc: true,
  },
  {
    id: 'lymph',
    name: 'Lymphocytes',
    unit: '%',
    ranges: [range('All', 20, 45, '20 – 45')],
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    decimals: 0,
    group: DLC_GROUP,
    isDlc: true,
  },
  {
    id: 'eos',
    name: 'Eosinophils',
    unit: '%',
    ranges: [range('All', 0, 6, '0 – 6')],
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    decimals: 0,
    group: DLC_GROUP,
    isDlc: true,
  },
  {
    id: 'mono',
    name: 'Monocytes',
    unit: '%',
    ranges: [range('All', 2, 10, '2 – 10')],
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    decimals: 0,
    group: DLC_GROUP,
    isDlc: true,
  },
  {
    id: 'baso',
    name: 'Basophils',
    unit: '%',
    ranges: [range('All', 0, 1, '0 – 1')],
    sliderMin: 0,
    sliderMax: 20,
    step: 1,
    decimals: 0,
    group: DLC_GROUP,
    isDlc: true,
  },
  {
    id: 'platelets',
    name: 'Platelet Count',
    unit: '/µL',
    ranges: [range('All', 150000, 450000, '1,50,000 – 4,50,000')],
    sliderMin: 20000,
    sliderMax: 800000,
    step: 1000,
    decimals: 0,
    conversion: { siUnit: 'x10^9/L', toSi: 0.001, siDecimals: 0 },
  },
  {
    id: 'esr',
    name: 'ESR (Westergren)',
    unit: 'mm/hr',
    ranges: [
      range('Male', 0, 15, '0 – 15'),
      range('Female', 0, 20, '0 – 20'),
    ],
    sliderMin: 0,
    sliderMax: 140,
    step: 1,
    decimals: 0,
  },
]

const lftParameters: ParameterDef[] = [
  {
    id: 'tbil',
    name: 'Total Bilirubin',
    unit: 'mg/dL',
    ranges: [range('All', 0.2, 1.2, '0.20 – 1.20')],
    sliderMin: 0,
    sliderMax: 30,
    step: 0.1,
    decimals: 2,
    conversion: BILI_SI,
  },
  {
    id: 'dbil',
    name: 'Direct Bilirubin',
    unit: 'mg/dL',
    ranges: [range('All', 0, 0.3, '0.00 – 0.30')],
    sliderMin: 0,
    sliderMax: 20,
    step: 0.1,
    decimals: 2,
    conversion: BILI_SI,
  },
  {
    id: 'ibil',
    name: 'Indirect Bilirubin',
    unit: 'mg/dL',
    ranges: [range('All', 0.1, 1, '0.10 – 1.00')],
    sliderMin: 0,
    sliderMax: 20,
    step: 0.1,
    decimals: 2,
    derivedFrom: 'indirect-bilirubin',
    conversion: BILI_SI,
  },
  {
    id: 'sgot',
    name: 'SGOT (AST)',
    unit: 'U/L',
    ranges: [range('All', undefined, 40, '≤ 40')],
    sliderMin: 0,
    sliderMax: 1000,
    step: 1,
    decimals: 0,
  },
  {
    id: 'sgpt',
    name: 'SGPT (ALT)',
    unit: 'U/L',
    ranges: [range('All', undefined, 40, '≤ 40')],
    sliderMin: 0,
    sliderMax: 1000,
    step: 1,
    decimals: 0,
  },
  {
    id: 'alp',
    name: 'Alkaline Phosphatase',
    unit: 'U/L',
    ranges: [range('All', 40, 129, '40 – 129')],
    sliderMin: 0,
    sliderMax: 1000,
    step: 1,
    decimals: 0,
  },
]

const lipidParameters: ParameterDef[] = [
  {
    id: 'chol',
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    ranges: [range('All', undefined, 200, '< 200')],
    sliderMin: 80,
    sliderMax: 450,
    step: 1,
    decimals: 0,
    conversion: CHOL_SI,
  },
  {
    id: 'tg',
    name: 'Triglycerides',
    unit: 'mg/dL',
    ranges: [range('All', undefined, 150, '< 150')],
    sliderMin: 40,
    sliderMax: 800,
    step: 1,
    decimals: 0,
    conversion: TG_SI,
  },
  {
    id: 'hdl',
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    ranges: [
      range('Male', 40, undefined, '≥ 40'),
      range('Female', 50, undefined, '≥ 50'),
    ],
    sliderMin: 10,
    sliderMax: 120,
    step: 1,
    decimals: 0,
    conversion: CHOL_SI,
  },
  {
    id: 'ldl',
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    ranges: [range('All', undefined, 100, '< 100')],
    sliderMin: 20,
    sliderMax: 300,
    step: 1,
    decimals: 0,
    derivedFrom: 'ldl-friedewald',
    conversion: CHOL_SI,
  },
  {
    id: 'vldl',
    name: 'VLDL Cholesterol',
    unit: 'mg/dL',
    ranges: [range('All', undefined, 30, '< 30')],
    sliderMin: 5,
    sliderMax: 100,
    step: 1,
    decimals: 0,
    derivedFrom: 'vldl',
    conversion: TG_SI,
  },
]

const kftParameters: ParameterDef[] = [
  {
    id: 'urea',
    name: 'Blood Urea',
    unit: 'mg/dL',
    ranges: [range('All', 15, 40, '15.0 – 40.0')],
    sliderMin: 5,
    sliderMax: 250,
    step: 0.1,
    decimals: 1,
    conversion: { siUnit: 'mmol/L', toSi: 0.1665, siDecimals: 1 },
  },
  {
    id: 'bun',
    name: 'Blood Urea Nitrogen',
    unit: 'mg/dL',
    ranges: [range('All', 7, 20, '7.0 – 20.0')],
    sliderMin: 2,
    sliderMax: 120,
    step: 0.1,
    decimals: 1,
    derivedFrom: 'bun',
    conversion: { siUnit: 'mmol/L', toSi: 0.357, siDecimals: 1 },
  },
  {
    id: 'creat',
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    ranges: [
      range('Male', 0.7, 1.3, '0.70 – 1.30'),
      range('Female', 0.6, 1.1, '0.60 – 1.10'),
    ],
    sliderMin: 0.2,
    sliderMax: 15,
    step: 0.01,
    decimals: 2,
    conversion: { siUnit: 'µmol/L', toSi: 88.4, siDecimals: 0 },
  },
  {
    id: 'ua',
    name: 'Uric Acid',
    unit: 'mg/dL',
    ranges: [
      range('Male', 3.5, 7.2, '3.5 – 7.2'),
      range('Female', 2.6, 6, '2.6 – 6.0'),
    ],
    sliderMin: 1,
    sliderMax: 15,
    step: 0.1,
    decimals: 1,
    conversion: { siUnit: 'µmol/L', toSi: 59.48, siDecimals: 0 },
  },
]

const thyroidParameters: ParameterDef[] = [
  {
    id: 'tsh',
    name: 'TSH',
    unit: 'µIU/mL',
    ranges: [range('All', 0.4, 4.2, '0.40 – 4.20')],
    sliderMin: 0.01,
    sliderMax: 100,
    step: 0.01,
    decimals: 2,
  },
  {
    id: 't3',
    name: 'Total T3',
    unit: 'ng/dL',
    ranges: [range('All', 80, 200, '80 – 200')],
    sliderMin: 20,
    sliderMax: 400,
    step: 1,
    decimals: 0,
    conversion: { siUnit: 'nmol/L', toSi: 0.01536, siDecimals: 2 },
  },
  {
    id: 't4',
    name: 'Total T4',
    unit: 'µg/dL',
    ranges: [range('All', 4.5, 12, '4.5 – 12.0')],
    sliderMin: 1,
    sliderMax: 25,
    step: 0.1,
    decimals: 1,
    conversion: { siUnit: 'nmol/L', toSi: 12.87, siDecimals: 0 },
  },
]

const sugarParameters: ParameterDef[] = [
  {
    id: 'fbs',
    name: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    ranges: [range('All', 70, 110, '70 – 110')],
    sliderMin: 40,
    sliderMax: 500,
    step: 1,
    decimals: 0,
    conversion: GLUCOSE_SI,
  },
  {
    id: 'ppbs',
    name: 'Post Prandial Blood Glucose',
    unit: 'mg/dL',
    ranges: [range('All', undefined, 140, '< 140')],
    sliderMin: 40,
    sliderMax: 500,
    step: 1,
    decimals: 0,
    conversion: GLUCOSE_SI,
  },
]

export const TEST_TEMPLATES: readonly TestTemplate[] = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    shortName: 'CBC',
    category: 'Haematology',
    kind: 'standard',
    keywords: ['cbc', 'hemogram', 'haemogram', 'hemoglobin', 'haemoglobin', 'dlc', 'platelets'],
    parameters: cbcParameters,
    interpretation: 'Red-cell indices are calculated from hemoglobin, RBC count, and PCV unless edited.',
  },
  {
    id: 'lft',
    name: 'Liver Function Test (LFT)',
    shortName: 'LFT',
    category: 'Biochemistry',
    kind: 'standard',
    keywords: ['lft', 'bilirubin', 'sgot', 'sgpt', 'ast', 'alt', 'liver'],
    parameters: lftParameters,
    interpretation: 'Indirect bilirubin is calculated as total bilirubin minus direct bilirubin.',
  },
  {
    id: 'lipid',
    name: 'Lipid Profile',
    shortName: 'Lipid',
    category: 'Biochemistry',
    kind: 'standard',
    keywords: ['lipid', 'cholesterol', 'triglyceride', 'hdl', 'ldl'],
    parameters: lipidParameters,
    interpretation: 'LDL and VLDL use the Friedewald equation when triglycerides are below 400 mg/dL.',
  },
  {
    id: 'kft',
    name: 'Kidney Function Test (KFT)',
    shortName: 'KFT',
    category: 'Biochemistry',
    kind: 'standard',
    keywords: ['kft', 'rft', 'creatinine', 'urea', 'uric', 'kidney', 'renal'],
    parameters: kftParameters,
    interpretation: 'BUN is calculated as blood urea ÷ 2.14.',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Profile',
    shortName: 'Thyroid',
    category: 'Biochemistry',
    kind: 'standard',
    keywords: ['thyroid', 'tsh', 't3', 't4'],
    parameters: thyroidParameters,
  },
  {
    id: 'sugar',
    name: 'Blood Sugar',
    shortName: 'Sugar',
    category: 'Biochemistry',
    kind: 'standard',
    keywords: ['sugar', 'glucose', 'fbs', 'ppbs', 'fasting', 'post prandial'],
    parameters: sugarParameters,
  },
  {
    id: 'widal',
    name: 'Widal Test (Slide Method)',
    shortName: 'Widal',
    category: 'Serology',
    kind: 'widal',
    keywords: ['widal', 'typhi', 'salmonella', 'serology', 'enteric'],
    parameters: [],
    interpretation: 'A single Widal test is not diagnostic. Correlate with clinical findings and blood culture.',
  },
]

export function getTemplate(templateId: string): TestTemplate | undefined {
  return TEST_TEMPLATES.find((template) => template.id === templateId)
}

export function emptyWidal(): WidalCell[] {
  const cells: WidalCell[] = []
  for (const antigen of WIDAL_ANTIGENS) {
    for (const dilution of WIDAL_DILUTIONS) {
      cells.push({ antigen: antigen.id, dilution, sign: '-' })
    }
  }
  return cells
}

export function blankValues(parameters: readonly ParameterDef[]): ParameterValue[] {
  return parameters.map((parameter) => ({
    id: parameter.id,
    value: null,
    flag: 'Normal',
    flagSource: 'auto',
    manualValue: false,
  }))
}

export function createActiveTest(templateId: string): ActiveTest | null {
  const template = getTemplate(templateId)
  if (!template) return null
  return {
    instanceId: crypto.randomUUID(),
    templateId,
    values: blankValues(template.parameters),
    widal: template.kind === 'widal' ? emptyWidal() : [],
  }
}
