/**
 * Maps legacy local public paths (under audited folders) to canonical S3 object keys.
 * Keys may live under `resilience360/` or `resilience360-static/` — server `mediaKeyCandidates` resolves aliases.
 */

export type ContentMediaCategory =
  | 'pgbc-pdf'
  | 'material-hub-guidance'
  | 'material-hub-hub'
  | 'material-hub-material'
  | 'disaster-dashboard'
  | 'retrofit-pdf'
  | 'infra-model-pdf'
  | 'learn-video'
  | 'homepage-spotlight'
  | 'portal-content'

/** Exact local relative paths (posix) → primary S3 key */
export const EXACT_LOCAL_TO_S3_KEY: Record<string, string> = {
  // PGBC — predefined codes (relative to /pgbc/)
  'All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf':
    'resilience360/pgbc/All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf',
  'All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf':
    'resilience360/pgbc/All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf',
  'All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf':
    'resilience360/pgbc/All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf',
  'All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf':
    'resilience360/pgbc/All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf',
  'All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf':
    'resilience360/pgbc/All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf',
  'All Codes/ecbc23/ecbc23.pdf': 'resilience360/pgbc/All Codes/ecbc23/ecbc23.pdf',
  'All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf':
    'resilience360/pgbc/All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf',
  'All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf':
    'resilience360/pgbc/All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf',

  // Material Hub — guidance (portal sync seeds)
  'assets/guidance/bamboo-installation-guide.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-bamboo-installation/bamboo-installation-guide.png',
  'assets/guidance/cgi-sheet-roofing.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-cgi-sheet-roofing/cgi-sheet-roofing.png',
  'assets/guidance/disaster-resilient-rope-tying-methods.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-rope-tying/disaster-resilient-rope-tying-methods.png',
  'assets/guidance/durable-wooden-plank-assembly-guide.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-wooden-plank/durable-wooden-plank-assembly-guide.png',
  'assets/guidance/eps-panel-fitting-guide.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-eps-panel/eps-panel-fitting-guide.png',
  'assets/guidance/pallet-handling-and-storage.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-pallet/pallet-handling-and-storage.png',
  'assets/guidance/polythene-sheet-installation-guide.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-polythene-sheet/polythene-sheet-installation-guide.png',
  'assets/guidance/steel-girder-placement-guide.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-steel-girder/steel-girder-placement-guide.png',
  'assets/guidance/wooden-stick-chick-mat-application.png':
    'resilience360-static/portals/material-hubs/material-hubs-guidance-chick-mat/wooden-stick-chick-mat-application.png',

  // Material Hub — hub images
  'assets/hubs/gilgit.jpg': 'resilience360-static/portals/material-hubs/material-hubs-gilgit/gilgit.jpg',
  'assets/hubs/muzaffargarh.jpg': 'resilience360-static/portals/material-hubs/material-hubs-muzaffargarh/muzaffargarh.jpg',
  'assets/hubs/sukkur.jpg': 'resilience360-static/portals/material-hubs/material-hubs-sukkur/sukkur.jpg',

  // Material Hub — material thumbnails
  'assets/materials/bamboo.jpg': 'resilience360-static/portals/material-hubs/material-hubs-bamboo/bamboo.jpg',
  'assets/materials/wooden-stick-chick-mat.jpg':
    'resilience360-static/portals/material-hubs/material-hubs-wooden-stick-chick-mat/wooden-stick-chick-mat.jpg',
  'assets/materials/polythene-sheet.jpg':
    'resilience360-static/portals/material-hubs/material-hubs-polythene-sheet/polythene-sheet.jpg',
  'assets/materials/cotton-rope.jpg': 'resilience360-static/portals/material-hubs/material-hubs-cotton-rope/cotton-rope.jpg',
  'assets/materials/steel-girder.jpg': 'resilience360-static/portals/material-hubs/material-hubs-steel-girder/steel-girder.jpg',
  'assets/materials/cgi-sheet.jpg': 'resilience360-static/portals/material-hubs/material-hubs-cgi-sheet/cgi-sheet.jpg',
  'assets/materials/wooden-plank.jpg': 'resilience360-static/portals/material-hubs/material-hubs-wooden-plank/wooden-plank.jpg',
  'assets/materials/eps-panel.jpg': 'resilience360-static/portals/material-hubs/material-hubs-eps-panel/eps-panel.jpg',
  'assets/materials/pallet.jpg': 'resilience360-static/portals/material-hubs/material-hubs-pallet/pallet.jpg',
}

/** Prefix rules applied when no exact match exists */
export const LOCAL_PREFIX_RULES: Array<{
  category: ContentMediaCategory
  match: RegExp
  toS3Key: (relativePath: string, match: RegExpMatchArray) => string[]
}> = [
  {
    category: 'pgbc-pdf',
    match: /^(?:public\/)?pgbc\/(.+\.pdf)$/i,
    toS3Key: (_rel, m) => [
      `resilience360/pgbc/${m[1]}`,
      `pgbc/${m[1]}`,
      `PGBC/${m[1].split('/').pop() ?? m[1]}`,
    ],
  },
  {
    category: 'material-hub-guidance',
    match: /^(?:public\/)?material-hubs\/(?:assets\/guidance|guidance-images|Guidance images)\/(.+)$/i,
    toS3Key: (_rel, m) => {
      const file = m[1].replace(/\\/g, '/')
      const slug = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return [
        `resilience360-static/portals/material-hubs/material-hubs-guidance-${slug}/${file}`,
        `resilience360/material-hubs/guidance/${file}`,
      ]
    },
  },
  {
    category: 'material-hub-hub',
    match: /^(?:public\/)?material-hubs\/assets\/hubs\/(.+)$/i,
    toS3Key: (_rel, m) => {
      const file = m[1]
      const hub = file.replace(/\.[^.]+$/, '').toLowerCase()
      return [`resilience360-static/portals/material-hubs/material-hubs-${hub}/${file}`]
    },
  },
  {
    category: 'disaster-dashboard',
    match: /^(?:public\/)?(?:assets\/for-disaster-dashboard|disaster-dashboard\/assets\/for disaster dashboard)\/([^/]+)\/(.+)$/i,
    toS3Key: (_rel, m) => {
      const folder = m[1]
        .toLowerCase()
        .trim()
        .replace(/\s*\/\s*/g, '-')
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-')
      const file = m[2].toLowerCase()
      const kind =
        file.includes('video') ? 'video.mp4'
        : file.includes('audio') ? 'audio.aac'
        : file.startsWith('image') ? 'image.png'
        : file
      return [
        `resilience360/disaster-dashboard/${folder}/${kind}`,
        `resilience360-static/disaster-dashboard/${folder}/${kind}`,
        `disaster-dashboard/${folder}/${kind}`,
      ]
    },
  },
  {
    category: 'retrofit-pdf',
    match: /^(?:public\/)?assets\/pdfs\/(.+\.pdf)$/i,
    toS3Key: (_rel, m) => [`resilience360/retrofit/${m[1]}`, `resilience360-static/retrofit/${m[1]}`],
  },
  {
    category: 'infra-model-pdf',
    match: /^(?:public\/)?assets\/models\/(.+)$/i,
    toS3Key: (_rel, m) => {
      const rest = m[1].replace(/\\/g, '/')
      const folder = rest.split('/')[0]?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') ?? 'default'
      if (/\.pdf$/i.test(rest)) {
        return [`resilient-infra-models/${folder}/model.pdf`, `resilience360/infra-models/${rest}`]
      }
      return [`resilient-infra-models/${folder}/image.jpeg`, `resilience360/infra-models/${rest}`]
    },
  },
  {
    category: 'learn-video',
    match: /^(?:public\/)?(?:assets\/)?learn(?:-and-train)?\/(.+\.(?:mp4|webm|m4a))$/i,
    toS3Key: (_rel, m) => [`resilience360/learn/${m[1]}`],
  },
  {
    category: 'homepage-spotlight',
    match: /^spotlight[\\/].+/i,
    toS3Key: (rel) => {
      const file = rel.split('/').pop() ?? rel
      return [
        `resilience360/spotlight carosel home/${file}`,
        `resilience360/spotlight carousel home/${file}`,
      ]
    },
  },
]

