/** Maps app disaster slugs → exact S3 folder names under `For disaster dashboard/`. */
export const getS3FolderName = (type: string): string => {
  const map: Record<string, string> = {
    'cold-wave': 'Cold wave',
    'crop-fire': 'Crop Fire',
    earthquake: 'Earthquake',
    flood: 'Flood',
    heatwave: 'Heatwave',
    landslide: 'Landslide',
    loadshedding: 'Loadshedding',
    'load-shedding': 'Loadshedding',
    smog: 'Smog',
    'storm-cyclone': 'Storm Cyclone',
    cyclone: 'Storm Cyclone',
    'urban-fire': 'Urban fire',
  }

  return map[type] || type
}
