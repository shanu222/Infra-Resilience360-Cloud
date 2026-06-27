import type { PortalLang } from '../../i18n/portalLanguage';
import type { Disaster } from './disasterTypes';
import { mergeDisasterUr } from './disasterUrdu';

export type { Disaster, Guidance, TimelineEvent } from './disasterTypes';

export const disastersEn: Disaster[] = [
  {
    id: 'flood',
    name: 'Flood',
    icon: 'waves',
    description: 'Overflow of water that submerges land, commonly caused by heavy rainfall, river overflow, or dam failure in Pakistan.',
    timeline: [
      { year: 2010, duration: '3 months' },
      { year: 2014, duration: '2 months' },
      { year: 2022, duration: '4–5 months' }
    ],
    seasonalPeriod: 'June – September (Monsoon season)',
    seasonalMonths: [5, 6, 7, 8], // June-Sept
    guidance: {
      before: [
        'Prepare emergency kit with food, water, and first aid',
        'Identify safe areas and evacuation routes',
        'Store important documents in waterproof containers',
        'Keep emergency contact numbers handy',
        'Monitor weather forecasts regularly'
      ],
      during: [
        'Stay calm and move to higher ground immediately',
        'Follow official instructions and evacuation orders',
        'Avoid walking or driving through floodwater',
        'Stay away from power lines and electrical equipment',
        'Keep your mobile phone charged for emergency calls'
      ],
      after: [
        'Check for injuries and provide first aid if needed',
        'Avoid damaged areas and buildings',
        'Contact local authorities for assistance',
        'Boil water before drinking',
        'Document damage for insurance claims'
      ]
    },
    color: 'bg-blue-500'
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    icon: 'activity',
    description: 'Ground shaking caused by tectonic plate movements. Pakistan lies in a seismically active zone with frequent tremors.',
    timeline: [
      { year: 2005, duration: 'Major event' },
      { year: 2013, duration: 'Severe tremors' },
      { year: 2015, duration: 'Multiple events' }
    ],
    seasonalPeriod: 'Can occur any time of year',
    seasonalMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    guidance: {
      before: [
        'Secure heavy furniture and appliances',
        'Prepare emergency kit with supplies',
        'Identify safe spots (doorways, under tables)',
        'Learn earthquake safety procedures',
        'Keep emergency supplies accessible'
      ],
      during: [
        'Drop, Cover, and Hold On',
        'Stay indoors if inside, outside if outside',
        'Move away from windows and heavy objects',
        'If outside, move to open areas away from buildings',
        'Do not use elevators'
      ],
      after: [
        'Check for injuries and hazards',
        'Expect aftershocks',
        'Avoid damaged buildings and infrastructure',
        'Listen to emergency broadcasts',
        'Help others if you can safely do so'
      ]
    },
    color: 'bg-amber-600'
  },
  {
    id: 'urban-fire',
    name: 'Urban Fire',
    icon: 'flame',
    description: 'Fires occurring in residential and commercial areas, often caused by electrical faults, gas leaks, or negligence in urban Pakistan.',
    timeline: [
      { year: 2012, duration: 'Factory fire incidents' },
      { year: 2019, duration: 'Market fire events' },
      { year: 2023, duration: 'Multiple incidents' }
    ],
    seasonalPeriod: 'Higher risk during summer months',
    seasonalMonths: [4, 5, 6, 7], // May-Aug
    guidance: {
      before: [
        'Install smoke detectors in your home',
        'Keep fire extinguishers accessible',
        'Check electrical wiring regularly',
        'Plan escape routes from buildings',
        'Store flammable materials safely'
      ],
      during: [
        'Alert others and call emergency services',
        'Stay low to avoid smoke inhalation',
        'Use stairs, never elevators',
        'Close doors behind you to slow fire spread',
        'If trapped, signal for help from windows'
      ],
      after: [
        'Do not re-enter until cleared by authorities',
        'Check for injuries and seek medical help',
        'Avoid damaged structures',
        'Contact insurance company',
        'Document all damages'
      ]
    },
    color: 'bg-red-500'
  },
  {
    id: 'crop-fire',
    name: 'Crop Fire',
    icon: 'wheat',
    description: 'Agricultural fires affecting farmland, often due to stubble burning or dry conditions in Punjab and Sindh provinces.',
    timeline: [
      { year: 2018, duration: 'Widespread burning season' },
      { year: 2020, duration: 'Extended fire period' },
      { year: 2023, duration: 'Multiple incidents' }
    ],
    seasonalPeriod: 'October – November (Post-harvest)',
    seasonalMonths: [9, 10], // Oct-Nov
    guidance: {
      before: [
        'Create firebreaks around farmland',
        'Monitor weather and wind conditions',
        'Keep firefighting equipment ready',
        'Educate workers on fire safety',
        'Remove dry vegetation and debris'
      ],
      during: [
        'Alert nearby farms and communities',
        'Call fire services immediately',
        'Use available water sources',
        'Create barriers to stop fire spread',
        'Evacuate livestock and people'
      ],
      after: [
        'Ensure fire is completely extinguished',
        'Assess damage to crops and land',
        'Report to agricultural authorities',
        'Begin soil rehabilitation',
        'Claim insurance if applicable'
      ]
    },
    color: 'bg-orange-500'
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    icon: 'sun',
    description: 'Prolonged periods of extreme heat, particularly dangerous in Sindh and Punjab regions with temperatures exceeding 45°C.',
    timeline: [
      { year: 2015, duration: '2 weeks (1,200+ deaths)' },
      { year: 2018, duration: '3 weeks' },
      { year: 2022, duration: '1 month' }
    ],
    seasonalPeriod: 'May – July (Peak summer)',
    seasonalMonths: [4, 5, 6], // May-July
    guidance: {
      before: [
        'Stock up on water and cooling supplies',
        'Identify air-conditioned or cool spaces',
        'Check on elderly and vulnerable neighbors',
        'Prepare light, breathable clothing',
        'Ensure fans and cooling systems work'
      ],
      during: [
        'Stay indoors during peak heat hours',
        'Drink plenty of water regularly',
        'Wear light-colored, loose clothing',
        'Avoid strenuous outdoor activities',
        'Never leave children or pets in vehicles'
      ],
      after: [
        'Monitor for heat-related illnesses',
        'Continue hydrating well',
        'Check on vulnerable community members',
        'Seek medical help if feeling unwell',
        'Report heat-related incidents'
      ]
    },
    color: 'bg-yellow-500'
  },
  {
    id: 'load-shedding',
    name: 'Load Shedding',
    icon: 'zap-off',
    description: 'Planned or emergency power cuts affecting daily life, businesses, and essential services across Pakistan.',
    timeline: [
      { year: 2013, duration: '6+ months (18-20 hours/day)' },
      { year: 2018, duration: '4 months' },
      { year: 2023, duration: 'Ongoing periodic cuts' }
    ],
    seasonalPeriod: 'Worse during summer (May – August)',
    seasonalMonths: [4, 5, 6, 7], // May-Aug
    guidance: {
      before: [
        'Keep flashlights and batteries ready',
        'Charge power banks and devices',
        'Store water for daily needs',
        'Prepare backup cooling solutions',
        'Know load-shedding schedule in your area'
      ],
      during: [
        'Unplug sensitive electronic devices',
        'Use battery-powered fans or generators safely',
        'Keep refrigerator and freezer closed',
        'Stay hydrated and keep cool',
        'Use alternative cooking methods if needed'
      ],
      after: [
        'Check appliances before switching on',
        'Recharge all devices and power banks',
        'Check food spoilage in refrigerator',
        'Report extended outages to authorities',
        'Prepare for next scheduled cut'
      ]
    },
    color: 'bg-purple-500'
  },
  {
    id: 'storm-cyclone',
    name: 'Storm / Cyclone',
    icon: 'cloud-lightning',
    description: 'Tropical cyclones and severe storms affecting coastal areas of Sindh and Balochistan, bringing heavy rain and strong winds.',
    timeline: [
      { year: 2007, duration: 'Cyclone Yemyin' },
      { year: 2010, duration: 'Cyclone Phet' },
      { year: 2019, duration: 'Cyclone Vayu threat' }
    ],
    seasonalPeriod: 'May – June & September – November',
    seasonalMonths: [4, 5, 8, 9, 10], // May-June, Sept-Nov
    guidance: {
      before: [
        'Monitor weather updates constantly',
        'Secure loose objects outside',
        'Stock emergency supplies',
        'Board up windows if advised',
        'Plan evacuation route'
      ],
      during: [
        'Stay indoors away from windows',
        'Follow evacuation orders immediately',
        'Keep emergency kit accessible',
        'Stay away from coastal areas',
        'Monitor official weather channels'
      ],
      after: [
        'Wait for all-clear from authorities',
        'Check for structural damage',
        'Avoid floodwater and debris',
        'Report damage to officials',
        'Help neighbors if safe to do so'
      ]
    },
    color: 'bg-indigo-500'
  },
  {
    id: 'landslide',
    name: 'Landslide',
    icon: 'mountain',
    description: 'Slope failures in hilly areas of KPK, Kashmir, and Gilgit-Baltistan, triggered by heavy rainfall or earthquakes.',
    timeline: [
      { year: 2010, duration: 'Attabad landslide' },
      { year: 2013, duration: 'Multiple events' },
      { year: 2020, duration: 'Monsoon-triggered slides' }
    ],
    seasonalPeriod: 'July – September (Monsoon season)',
    seasonalMonths: [6, 7, 8], // July-Sept
    guidance: {
      before: [
        'Monitor rainfall and slope stability',
        'Identify safe evacuation routes',
        'Prepare emergency supplies',
        'Stay aware of warning signs',
        'Avoid building near steep slopes'
      ],
      during: [
        'Evacuate immediately if warned',
        'Move away from the path of landslide',
        'Listen for unusual sounds (trees cracking)',
        'Alert others in the danger zone',
        'Do not return until declared safe'
      ],
      after: [
        'Stay away from affected area',
        'Watch for additional slides',
        'Report blocked roads or damage',
        'Check for injured people',
        'Follow official recovery guidelines'
      ]
    },
    color: 'bg-stone-600'
  },
  {
    id: 'cold-wave',
    name: 'Cold Wave',
    icon: 'snowflake',
    description: 'Severe cold weather affecting northern regions and upper Pakistan, causing health issues and disrupting daily life.',
    timeline: [
      { year: 2012, duration: '2 months' },
      { year: 2019, duration: '6 weeks (heavy snowfall)' },
      { year: 2023, duration: '1 month' }
    ],
    seasonalPeriod: 'December – February (Winter)',
    seasonalMonths: [11, 0, 1], // Dec-Feb
    guidance: {
      before: [
        'Stock warm clothing and blankets',
        'Ensure heating systems work properly',
        'Store food and fuel supplies',
        'Prepare for potential road closures',
        'Check on vulnerable neighbors'
      ],
      during: [
        'Stay indoors when possible',
        'Dress in warm layers',
        'Use heating safely (avoid carbon monoxide)',
        'Keep moving to maintain body heat',
        'Watch for signs of hypothermia or frostbite'
      ],
      after: [
        'Check for cold-related health issues',
        'Help those affected by cold',
        'Clear ice and snow safely',
        'Report infrastructure damage',
        'Replenish emergency supplies'
      ]
    },
    color: 'bg-cyan-500'
  },
  {
    id: 'smog',
    name: 'Smog',
    icon: 'wind',
    description: 'Severe air pollution creating hazardous smog in major cities like Lahore and Karachi, affecting health and visibility.',
    timeline: [
      { year: 2017, duration: '2 months (record levels)' },
      { year: 2019, duration: '6 weeks' },
      { year: 2023, duration: '2+ months' }
    ],
    seasonalPeriod: 'October – January (Winter)',
    seasonalMonths: [9, 10, 11, 0], // Oct-Jan
    guidance: {
      before: [
        'Stock up on face masks (N95)',
        'Install air purifiers at home',
        'Monitor air quality index daily',
        'Prepare indoor activities',
        'Keep medication for respiratory issues ready'
      ],
      during: [
        'Stay indoors as much as possible',
        'Wear N95 masks when going out',
        'Keep windows closed',
        'Use air purifiers indoors',
        'Avoid outdoor exercise and strenuous activity'
      ],
      after: [
        'Continue monitoring air quality',
        'Seek medical help for breathing issues',
        'Clean indoor spaces thoroughly',
        'Replace air filters',
        'Advocate for pollution control measures'
      ]
    },
    color: 'bg-gray-500'
  }
];

/** English dataset (default). Alias kept for any legacy imports. */
export const disasters = disastersEn;

export function getDisasters(lang: PortalLang): Disaster[] {
  if (lang === 'en') return disastersEn;
  return disastersEn.map((d) => mergeDisasterUr(d));
}
