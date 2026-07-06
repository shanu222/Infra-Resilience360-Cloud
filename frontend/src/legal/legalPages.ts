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
    description: 'How Infra Resilience360 collects, uses, protects, and handles your information.',
    sections: [
      {
        title: 'Introduction',
        body: [
          'Infra Resilience360 supports disaster resilience planning, preparedness, and response guidance.',
          'This Privacy Policy explains what information may be collected and how it is used.',
        ],
      },
      {
        title: 'Information We May Collect',
        body: [
          'Location data, only when you request location-based guidance features.',
          'Photos you select or capture, only when you choose image-based assessment features.',
          'Notification preferences and essential app settings needed to provide requested services.',
        ],
      },
      {
        title: 'How Information Is Used',
        body: [
          'To provide risk insights, retrofit guidance, and resilience recommendations.',
          'To improve reliability, safety, and quality of service.',
          'To support optional AI-assisted analysis when you choose related features.',
        ],
      },
      {
        title: 'Permissions',
        body: [
          'Camera: used only when you choose to capture an image.',
          'Photo access: used only when you choose to select an image from your gallery.',
          'Location: used only when you request location-enabled guidance.',
          'Notifications: used only for alerts and important app updates when enabled.',
        ],
      },
      {
        title: 'Data Security',
        body: [
          'We use reasonable administrative and technical safeguards to protect information.',
          'Data is transmitted over secure connections where available.',
        ],
      },
      {
        title: 'Your Rights',
        body: [
          'You can disable optional permissions from your device settings at any time.',
          'You may contact us to request support regarding your data and privacy concerns.',
        ],
      },
      {
        title: 'Contact',
        body: ['Email: info@ndma.gov.pk'],
      },
    ],
  },
  '/terms-and-conditions': {
    path: '/terms-and-conditions',
    title: 'Terms and Conditions',
    description: 'Terms governing your use of Infra Resilience360.',
    sections: [
      {
        title: 'Acceptable Use',
        body: [
          'You agree to use the app lawfully and responsibly.',
          'You must not misuse the service, attempt unauthorized access, or disrupt operations.',
        ],
      },
      {
        title: 'User Responsibilities',
        body: [
          'You are responsible for how you apply information provided by the app.',
          'You should verify critical decisions with qualified professionals and relevant authorities.',
        ],
      },
      {
        title: 'AI and Engineering Disclaimer',
        body: [
          'AI-assisted outputs are informational and do not replace professional engineering judgment.',
          'The app does not provide legal, emergency command, or certified engineering approval.',
        ],
      },
      {
        title: 'Intellectual Property',
        body: [
          'All applicable content, branding, and materials remain protected by intellectual property laws.',
          'You may not copy or redistribute protected materials without proper authorization.',
        ],
      },
      {
        title: 'Availability and Updates',
        body: [
          'Service availability may vary over time and by region.',
          'We may update features, content, and policies to improve quality and compliance.',
        ],
      },
      {
        title: 'Limitation of Liability',
        body: [
          'The service is provided on an as-available basis.',
          'To the extent permitted by law, liability is limited for indirect or consequential losses.',
        ],
      },
      {
        title: 'Contact',
        body: ['Email: info@ndma.gov.pk'],
      },
    ],
  },
  '/about': {
    path: '/about',
    title: 'About Infra Resilience360',
    description: 'Our mission and service purpose.',
    sections: [
      {
        title: 'Who We Are',
        body: [
          'Infra Resilience360 is a disaster resilience support platform for preparedness and recovery planning.',
          'The app helps users access practical resilience guidance across multiple hazard scenarios.',
        ],
      },
      {
        title: 'What the App Provides',
        body: [
          'Risk-informed guidance for infrastructure resilience and safer planning decisions.',
          'Educational resources, alerts, and support tools for field and planning workflows.',
        ],
      },
    ],
  },
  '/contact': {
    path: '/contact',
    title: 'Contact',
    description: 'How to reach us for support and information.',
    sections: [
      {
        title: 'Support Contact',
        body: [
          'Email: info@ndma.gov.pk',
          'Phone: +92-51-9205200',
        ],
      },
      {
        title: 'Website',
        body: [
          'https://infra-resilience360-cloud-production.up.railway.app',
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
