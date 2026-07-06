export const LEGAL_WEB_BASE_URL = 'https://infra-resilience360-cloud-production.up.railway.app'

export const LEGAL_PAGE_PATHS = [
  '/privacy-policy',
  '/terms-and-conditions',
  '/about',
  '/contact',
  '/ai-disclaimer',
  '/open-source-licenses',
] as const

export type LegalPagePath = (typeof LEGAL_PAGE_PATHS)[number]

export type LegalSection = {
  title: string
  body: string[]
}

export type LegalPageContent = {
  path: LegalPagePath
  title: string
  description: string
  sections: LegalSection[]
}

const LEGAL_PAGES: Record<LegalPagePath, LegalPageContent> = {
  '/privacy-policy': {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How Infra Resilience360 collects, uses, and protects information.',
    sections: [
      {
        title: 'Overview',
        body: [
          'Infra Resilience360 is designed to deliver disaster resilience guidance and planning support.',
          'This policy explains what information is processed by the app and related services.',
        ],
      },
      {
        title: 'Data Processed',
        body: [
          'The app may process location (when explicitly requested), selected images, and user interaction preferences.',
          'Operational backend logs may include technical metadata needed for reliability and security.',
        ],
      },
      {
        title: 'Media and AI Processing',
        body: [
          'Selected user images may be sent securely to backend services and configured AI providers for analysis features.',
          'Do not upload highly sensitive personal images unless required by your workflow.',
        ],
      },
      {
        title: 'Contact',
        body: ['For privacy requests, contact the project support channel listed on the Contact page.'],
      },
    ],
  },
  '/terms-and-conditions': {
    path: '/terms-and-conditions',
    title: 'Terms and Conditions',
    description: 'Terms governing the use of Infra Resilience360.',
    sections: [
      {
        title: 'Use of Service',
        body: [
          'This application provides informational support and planning assistance for resilience and disaster readiness.',
          'Users remain responsible for engineering judgment and compliance with local regulations.',
        ],
      },
      {
        title: 'No Warranty',
        body: [
          'Content is provided on an as-is basis without guarantees of completeness or suitability for every scenario.',
          'Always validate critical decisions with qualified professionals and official authorities.',
        ],
      },
      {
        title: 'Service Availability',
        body: [
          'Some features depend on third-party APIs, internet connectivity, and cloud-hosted media availability.',
          'Temporary outages may occur despite best-effort reliability controls.',
        ],
      },
    ],
  },
  '/about': {
    path: '/about',
    title: 'About Infra Resilience360',
    description: 'Platform mission, purpose, and scope.',
    sections: [
      {
        title: 'Mission',
        body: [
          'Infra Resilience360 helps teams improve preparedness, response, and resilient reconstruction decisions.',
          'The platform combines maps, media guidance, and decision-support workflows for practical implementation.',
        ],
      },
      {
        title: 'Scope',
        body: [
          'Modules include resilience guidance, retrofit support, hazard insights, and training resources.',
          'The platform is intended to complement, not replace, official disaster management procedures.',
        ],
      },
    ],
  },
  '/contact': {
    path: '/contact',
    title: 'Contact',
    description: 'Support and communication channels for Infra Resilience360.',
    sections: [
      {
        title: 'Support',
        body: [
          'For support, use your designated project support workflow and technical operations contacts.',
          'For urgent disaster response, always rely on official emergency channels first.',
        ],
      },
      {
        title: 'Official Resources',
        body: [
          'National Disaster Management Authority (NDMA): https://ndma.gov.pk',
          'Infra Resilience web portal: https://www.infraresilience.org',
        ],
      },
    ],
  },
  '/ai-disclaimer': {
    path: '/ai-disclaimer',
    title: 'AI Disclaimer',
    description: 'Important limitations and responsible use guidance for AI-assisted outputs.',
    sections: [
      {
        title: 'AI-Assisted Content',
        body: [
          'Some outputs are generated with AI models and may contain inaccuracies or incomplete recommendations.',
          'AI outputs must be reviewed by qualified personnel before operational use.',
        ],
      },
      {
        title: 'Safety Notice',
        body: [
          'Do not treat AI responses as emergency directives or formal engineering certification.',
          'Use official advisories, regulations, and licensed professionals for critical decisions.',
        ],
      },
    ],
  },
  '/open-source-licenses': {
    path: '/open-source-licenses',
    title: 'Open Source Licenses',
    description: 'Acknowledgement of open-source software components.',
    sections: [
      {
        title: 'Third-Party Software',
        body: [
          'Infra Resilience360 uses open-source libraries distributed under their respective licenses.',
          'A full dependency and license inventory should be maintained as part of release governance.',
        ],
      },
      {
        title: 'License Compliance',
        body: [
          'Attributions and notices should be preserved in project documentation and release assets as required.',
        ],
      },
    ],
  },
}

export const LEGAL_LINKS = LEGAL_PAGE_PATHS.map((path) => ({
  path,
  title: LEGAL_PAGES[path].title,
}))

export function isLegalPath(pathname: string): pathname is LegalPagePath {
  return LEGAL_PAGE_PATHS.includes(pathname as LegalPagePath)
}

export function getLegalPageContent(pathname: string): LegalPageContent | null {
  if (!isLegalPath(pathname)) return null
  return LEGAL_PAGES[pathname]
}

export function getPublicLegalUrl(path: LegalPagePath): string {
  return `${LEGAL_WEB_BASE_URL}${path}`
}
