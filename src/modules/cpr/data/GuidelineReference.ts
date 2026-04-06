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
    name: '按压频率',
    target: '100-120',
    unit: '次/分钟',
    description: '用力、快速地按压，保持每分钟 100-120 次的频率',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '按压过慢（<100 次/分钟）',
      '按压过快（>120 次/分钟）',
    ],
  },
  {
    id: 'compression_depth',
    name: '按压深度',
    target: '5-6',
    unit: '厘米',
    description: '按压深度至少 5 厘米，但不超过 6 厘米',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '按压过浅（<5 厘米）',
      '按压过深（>6 厘米），有肋骨骨折风险',
    ],
  },
  {
    id: 'chest_recoil',
    name: '胸廓完全回弹',
    target: '完全回弹',
    description: '每次按压之间允许胸廓完全回弹，以保证静脉回流',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '按压间隙倚靠在胸部',
      '因疲劳导致回弹不完全',
    ],
  },
  {
    id: 'compression_fraction',
    name: '按压分数',
    target: '>60',
    unit: '%',
    description: '尽量减少中断，保持按压分数在 60% 以上',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '通气时暂停过久',
      '脉搏检查中断过多',
    ],
  },
  {
    id: 'hand_position',
    name: '手部位置',
    target: '胸骨下半段',
    description: '将一只手的掌根放在胸骨下半段，另一只手叠放其上',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '手部位置过高',
      '手部位于剑突上',
    ],
  },
  {
    id: 'arm_position',
    name: '手臂姿势',
    target: '伸直、锁定肘关节',
    description: '保持手臂伸直、肘关节锁定，利用体重进行按压',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '按压时肘关节弯曲',
      '用手臂力量而非体重按压',
    ],
  },
  {
    id: 'cycle_switch',
    name: '施救者轮换',
    target: '每 2 分钟',
    description: '每 2 分钟或每 5 个 30:2 周期轮换施救者，防止疲劳',
    source: 'AHA 2025 BLS 指南',
    commonErrors: [
      '未及时轮换导致疲劳',
      '轮换耗时过长，造成中断',
    ],
  },
];
