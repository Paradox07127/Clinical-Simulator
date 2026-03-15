export interface GuidelineParameter {
  id: string;
  name: string;
  target: string;
  unit?: string;
  description: string;
  source: string;
  commonErrors: string[];
}

export const AHA_BLS_GUIDELINES: GuidelineParameter[] = [
  {
    id: 'compression_rate',
    name: 'Compression Rate',
    target: '100-120',
    unit: 'compressions/min',
    description: 'Push hard and fast at a rate of 100-120 compressions per minute',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Compressing too slowly (<100/min)',
      'Compressing too fast (>120/min)',
    ],
  },
  {
    id: 'compression_depth',
    name: 'Compression Depth',
    target: '5-6',
    unit: 'cm (2-2.4 in)',
    description: 'Compress the chest to a depth of at least 5 cm but no more than 6 cm',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Shallow compressions (<5 cm)',
      'Excessive depth (>6 cm) risking rib fractures',
    ],
  },
  {
    id: 'chest_recoil',
    name: 'Full Chest Recoil',
    target: 'Complete',
    description: 'Allow the chest to fully recoil between each compression to permit venous return',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Leaning on the chest between compressions',
      'Not allowing full recoil due to fatigue',
    ],
  },
  {
    id: 'compression_fraction',
    name: 'Compression Fraction',
    target: '>60',
    unit: '%',
    description: 'Minimize interruptions to keep the compression fraction above 60%',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Prolonged pauses for ventilation',
      'Excessive interruptions for pulse checks',
    ],
  },
  {
    id: 'hand_position',
    name: 'Hand Position',
    target: 'Lower half of sternum',
    description: 'Place the heel of one hand on the lower half of the sternum with the other hand on top',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Hands placed too high on the sternum',
      'Hands placed over the xiphoid process',
    ],
  },
  {
    id: 'arm_position',
    name: 'Arm Position',
    target: 'Straight, locked elbows',
    description: 'Keep arms straight with elbows locked, using body weight for compressions',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Bending elbows during compressions',
      'Using arm strength instead of body weight',
    ],
  },
  {
    id: 'cycle_switch',
    name: 'Compressor Switch',
    target: 'Every 2 min',
    description: 'Switch compressors every 2 minutes or every 5 cycles of 30:2 to prevent fatigue',
    source: 'AHA 2020 BLS Guidelines',
    commonErrors: [
      'Not switching compressors leading to fatigue',
      'Taking too long during the switch, causing interruptions',
    ],
  },
];
