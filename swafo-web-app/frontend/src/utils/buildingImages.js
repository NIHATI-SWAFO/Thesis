/**
 * DLSU-D Authentic Campus Building & Landmark Images
 * Real campus evidence photos cataloged for SWAFO patrol checkpoints, history, and violation evidence.
 */

export const BUILDING_IMAGE_PATHS = {
  ICTC: '/images/buildings/ictc-building.jpg',
  ICTC_PARKING: '/images/buildings/ictc-parking.jpg',
  CTHM_PARKING: '/images/buildings/cthm-parking.jpg',
  URO: '/images/buildings/uro-building.jpg',
  ROTUNDA: '/images/buildings/rotunda.jpg',
  JFH_KUBO: '/images/buildings/jfh-kubo.jpg',
  JFH: '/images/buildings/jfh-building.jpg',
  PBH: '/images/buildings/pbh-building.jpg',
  AYUNTAMIENTO: '/images/buildings/ayuntamiento.jpg',
  PCH: '/images/buildings/pch-building.jpg',
  BOTANICAL: '/images/buildings/botanical-garden.jpg',
  LIBRARY: '/images/buildings/library.jpg',
  CHAPEL: '/images/buildings/chapel.jpg',
  FOOD_SQUARE: '/images/buildings/food-square.jpg',
  DORMITORY: '/images/buildings/dormitory.jpg',
};

export const BUILDING_CATALOG = [
  {
    id: 'ictc-bldg',
    name: 'ICTC Building',
    aliases: ['ictc', 'information and communications technology', 'ictc building'],
    image: BUILDING_IMAGE_PATHS.ICTC,
    zone: 'Zone 1: Magdalo Gate & Entry',
    category: 'Academic Building',
    description: 'Information and Communications Technology Center main entrance.',
  },
  {
    id: 'ictc-parking',
    name: 'ICTC Student Parking',
    aliases: ['ictc parking', 'student parking', 'ictc student parking', 'parking only'],
    image: BUILDING_IMAGE_PATHS.ICTC_PARKING,
    zone: 'Zone 1: Magdalo Gate & Entry',
    category: 'Parking Area',
    description: 'Designated student vehicle parking area near ICTC and Grandstand road.',
  },
  {
    id: 'uro-bldg',
    name: 'La Porteria De San Benildo / URO',
    aliases: ['uro', 'la porteria', 'la porteria de san benildo', 'registrar', 'swfo', 'swafo', 'pickup coffee'],
    image: BUILDING_IMAGE_PATHS.URO,
    zone: 'Zone 1: Magdalo Gate & Entry',
    category: 'Administrative & Services',
    description: 'La Porteria de San Benildo housing URO, SWAFO, and campus services.',
  },
  {
    id: 'cthm-parking',
    name: 'CTHM Building Parking',
    aliases: ['cthm parking', 'cthm building parking', 'cth parking', 'tourism parking'],
    image: BUILDING_IMAGE_PATHS.CTHM_PARKING,
    zone: 'Zone 5: Central Academic (West)',
    category: 'Parking Area',
    description: 'Parking lot and vehicle access beside the College of Tourism & Hospitality Management.',
  },
  {
    id: 'rotunda',
    name: 'Campus Rotunda',
    aliases: ['rotunda', 'rotonda', 'roundabout', 'monument', 'de la salle statue'],
    image: BUILDING_IMAGE_PATHS.ROTUNDA,
    zone: 'Zone 1 / Central Hub',
    category: 'Facility & Landmark',
    description: 'St. John Baptist De La Salle monument at the central campus traffic rotunda.',
  },
  {
    id: 'jfh-bldg',
    name: 'Julian Felipe Hall (JFH)',
    aliases: ['julian felipe hall', 'jfh', 'clac', 'college of liberal arts'],
    image: BUILDING_IMAGE_PATHS.JFH,
    zone: 'Zone 2: South Admin & Academic',
    category: 'Academic Building',
    description: 'Julian Felipe Hall - College of Liberal Arts and Communication main facade.',
  },
  {
    id: 'jfh-kubo',
    name: 'JFH Study Kubo',
    aliases: ['jfh kubo', 'kubo', 'clac kubo', 'study shed', 'gazebo', 'ldh kubo'],
    image: BUILDING_IMAGE_PATHS.JFH_KUBO,
    zone: 'Zone 2: South Admin & Academic',
    category: 'Student Pavilion',
    description: 'Covered outdoor student gazebos and study walkways along JFH quadrangle.',
  },
  {
    id: 'pch-bldg',
    name: 'Paulo Campos Hall (PCH)',
    aliases: ['paulo campos', 'paulo campos hall', 'pch', 'cscs'],
    image: BUILDING_IMAGE_PATHS.PCH,
    zone: 'Zone 2: South Admin & Academic',
    category: 'Academic Building',
    description: 'Paulo Campos Hall science and computer studies facility and parking frontage.',
  },
  {
    id: 'pbh-bldg',
    name: 'Purificacion Borromeo Hall (PBH)',
    aliases: ['purificacion borromeo hall', 'pbh', 'borromeo hall', 'cthm hall'],
    image: BUILDING_IMAGE_PATHS.PBH,
    zone: 'Zone 5: Central Academic (West)',
    category: 'Academic Building',
    description: 'Classic arched facade and pedestrian crossing leading to Borromeo Hall.',
  },
  {
    id: 'ayuntamiento',
    name: 'Ayuntamiento De Gonzalez',
    aliases: ['ayuntamiento', 'ayuntamiento de gonzalez', 'cbaa', 'business administration'],
    image: BUILDING_IMAGE_PATHS.AYUNTAMIENTO,
    zone: 'Zone 2: South Admin & Academic',
    category: 'Academic & Admin',
    description: 'Heritage Spanish-style Ayuntamiento building housing CBAA administration.',
  },
  {
    id: 'botanical',
    name: 'Botanical Garden Park',
    aliases: ['botanical garden', 'botanical garden park', 'shrine', 'marian shrine', 'nature park'],
    image: BUILDING_IMAGE_PATHS.BOTANICAL,
    zone: 'Zone 3: Library, Chapel & Cultural',
    category: 'Religious & Nature Park',
    description: 'Our Lady of the Miraculous Medal shrine and tranquil red-brick garden circle.',
  },
  {
    id: 'library',
    name: 'Aklatang Emilio Aguinaldo',
    aliases: ['aklatang emilio aguinaldo', 'library', 'aea', 'main library', 'rizal library'],
    image: BUILDING_IMAGE_PATHS.LIBRARY,
    zone: 'Zone 3: Library, Chapel & Cultural',
    category: 'Library & Cultural',
    description: 'Emilio Aguinaldo heritage landmark library building and cobblestone driveway.',
  },
  {
    id: 'chapel',
    name: 'Chapel of Our Lady of the Holy Rosary',
    aliases: ['chapel', 'cojuangco memorial chapel', 'holy rosary chapel', 'church'],
    image: BUILDING_IMAGE_PATHS.CHAPEL,
    zone: 'Zone 3: Library, Chapel & Cultural',
    category: 'Chapel & Religious',
    description: 'Antonio and Victoria Cojuangco Memorial Chapel of Our Lady of the Holy Rosary.',
  },
  {
    id: 'food-square',
    name: 'University Food Square (UFS)',
    aliases: ['food square', 'university food square', 'ufs', 'canteen', 'food court'],
    image: BUILDING_IMAGE_PATHS.FOOD_SQUARE,
    zone: 'Zone 4: Food Court & Dormitory',
    category: 'Food & Canteen',
    description: 'Campus open-air dining center featuring diverse student food kiosks and cafes.',
  },
  {
    id: 'dormitory',
    name: 'Ladies Dormitory Complex',
    aliases: ['dormitory', 'dorm', 'ladies dormitory complex', 'residencia la salle', 'housing'],
    image: BUILDING_IMAGE_PATHS.DORMITORY,
    zone: 'Zone 4: Food Court & Dormitory',
    category: 'Residential Facility',
    description: 'Campus on-site student housing bungalows and perimeter residential walkways.',
  },
];

/**
 * Returns matching photo URL for a given building or checkpoint name
 */
export function getBuildingImage(nameOrLocation) {
  if (!nameOrLocation) return null;
  const clean = nameOrLocation.toLowerCase().trim();

  // 1. Direct match with ID or exact name
  const exact = BUILDING_CATALOG.find(b => 
    b.name.toLowerCase() === clean || 
    b.id.toLowerCase() === clean
  );
  if (exact) return exact.image;

  // 2. Keyword/alias substring match
  const aliasMatch = BUILDING_CATALOG.find(b =>
    b.aliases.some(alias => clean.includes(alias) || alias.includes(clean))
  );
  if (aliasMatch) return aliasMatch.image;

  // 3. Fallback based on common keywords
  if (clean.includes('ictc') || clean.includes('tech')) return BUILDING_IMAGE_PATHS.ICTC;
  if (clean.includes('felipe') || clean.includes('jfh')) return BUILDING_IMAGE_PATHS.JFH;
  if (clean.includes('borromeo') || clean.includes('pbh')) return BUILDING_IMAGE_PATHS.PBH;
  if (clean.includes('campos') || clean.includes('pch')) return BUILDING_IMAGE_PATHS.PCH;
  if (clean.includes('ayuntamiento') || clean.includes('gonzalez')) return BUILDING_IMAGE_PATHS.AYUNTAMIENTO;
  if (clean.includes('botanical') || clean.includes('garden')) return BUILDING_IMAGE_PATHS.BOTANICAL;
  if (clean.includes('library') || clean.includes('aguinaldo') || clean.includes('aklatan')) return BUILDING_IMAGE_PATHS.LIBRARY;
  if (clean.includes('chapel') || clean.includes('church') || clean.includes('rosary')) return BUILDING_IMAGE_PATHS.CHAPEL;
  if (clean.includes('food') || clean.includes('canteen') || clean.includes('square')) return BUILDING_IMAGE_PATHS.FOOD_SQUARE;
  if (clean.includes('dorm') || clean.includes('residencia')) return BUILDING_IMAGE_PATHS.DORMITORY;
  if (clean.includes('rotunda') || clean.includes('rotonda')) return BUILDING_IMAGE_PATHS.ROTUNDA;
  if (clean.includes('porteria') || clean.includes('swfo') || clean.includes('uro')) return BUILDING_IMAGE_PATHS.URO;
  if (clean.includes('parking')) return clean.includes('cth') ? BUILDING_IMAGE_PATHS.CTHM_PARKING : BUILDING_IMAGE_PATHS.ICTC_PARKING;

  return null;
}

/**
 * Returns all building photos associated with a given zone or location
 */
export function getZoneImages(zoneNameOrLocation) {
  if (!zoneNameOrLocation) return [BUILDING_CATALOG[0].image];
  const clean = zoneNameOrLocation.toLowerCase();

  const matched = BUILDING_CATALOG.filter(b => 
    b.zone.toLowerCase().includes(clean) || 
    clean.includes(b.zone.toLowerCase()) ||
    b.aliases.some(a => clean.includes(a))
  );

  return matched.length > 0 
    ? matched.map(m => ({ url: m.image, location: m.name }))
    : [{ url: BUILDING_CATALOG[0].image, location: zoneNameOrLocation }];
}
