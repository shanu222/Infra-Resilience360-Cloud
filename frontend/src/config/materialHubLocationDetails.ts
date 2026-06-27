import type { MaterialHub } from './materialHubCatalog'

export type MaterialHubLocationDetail = {
  province: string
  description: string
  coverageAreas: string[]
  contact?: {
    phone?: string
    email?: string
  }
}

export const MATERIAL_HUB_LOCATION_DETAILS: Record<string, MaterialHubLocationDetail> = {
  gb1: {
    province: 'Gilgit-Baltistan',
    description:
      'Northern logistics and resilient materials distribution point serving mountain and river-valley communities after floods and landslides.',
    coverageAreas: ['Gupis', 'Yasin', 'Darel', 'Tangir', 'Ghizer'],
    contact: { phone: '+92-5811-000000', email: 'gilgit.hub@ndma.gov.pk' },
  },
  mzg1: {
    province: 'Punjab',
    description:
      'Central flood-response and reconstruction supply hub supporting Punjab districts along the Indus belt with rapid dispatch of shelter materials.',
    coverageAreas: ['Muzaffargarh City', 'Kot Addu', 'Alipur', 'Jatoi'],
    contact: { phone: '+92-66-0000000', email: 'muzaffargarh.hub@ndma.gov.pk' },
  },
  sukkur1: {
    province: 'Sindh',
    description:
      'Sindh-region emergency stock and dispatch center for monsoon flooding and heatwave relief, linking southern PDMA networks.',
    coverageAreas: ['Sukkur City', 'Rohri', 'Pano Aqil', 'New Sukkur'],
    contact: { phone: '+92-71-0000000', email: 'sukkur.hub@ndma.gov.pk' },
  },
  jalozai1: {
    province: 'Khyber Pakhtunkhwa',
    description:
      'KPK-region material staging hub supporting rapid shelter reconstruction and relief dispatch across northern and central districts.',
    coverageAreas: ['Nowshera', 'Charsadda', 'Peshawar', 'Mardan'],
    contact: { phone: '+92-91-0000000', email: 'jalozai.hub@ndma.gov.pk' },
  },
}

export function getMaterialHubLocationDetail(hub: MaterialHub): MaterialHubLocationDetail {
  return (
    MATERIAL_HUB_LOCATION_DETAILS[hub.id] ?? {
      province: hub.district,
      description: `${hub.name} supports disaster reconstruction and material distribution in ${hub.location}.`,
      coverageAreas: [hub.location, hub.district],
    }
  )
}
