import type { CprScenario } from '../types';

const BEGINNER_SCENARIO: CprScenario = {
  id: 'adult-hands-only-basic',
  title: '仅按压 CPR（入门）',
  difficulty: 'Beginner',
  trainingMode: 'HANDS_ONLY',
  emergencyType: '基础急救',
  background:
    '一名成人突然倒地失去意识。学员需要确认自身准备就绪，保持稳定的胸外按压，并维持安全的身体姿势。',
  requiredFirstSteps: [
    '确认身体位置就绪',
    '开始持续胸外按压',
    '保持目标节奏',
    '双手居中、手臂伸直',
  ],
  commonMistakes: [
    '按压频率低于 100 次/分钟',
    '按压频率高于 120 次/分钟',
    '按压时肘关节弯曲',
    '手部偏离胸骨中线',
  ],
  escalationConditions: [
    '手部多次脱离摄像头视野',
    '按压频率持续偏离目标范围',
    '身体姿势长时间不规范',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

const INTERMEDIATE_SCENARIO: CprScenario = {
  id: 'adult-bls-intermediate',
  title: '成人 BLS 流程',
  difficulty: 'Intermediate',
  trainingMode: 'CONVENTIONAL_30_2',
  emergencyType: 'BLS 标准流程',
  background:
    '旁观者在公园发现一名倒地失去意识的成人。请按照完整的 BLS 流程操作：确认现场安全、检查意识、启动急救系统、评估呼吸，然后开始 30:2 的 CPR 循环，每 2 分钟进行施救者轮换。',
  requiredFirstSteps: [
    '确认现场安全',
    '检查意识反应（拍肩呼唤）',
    '拨打 120 / 启动急救系统',
    '检查呼吸（看-听-感觉）',
    '开始胸外按压',
    '实施人工呼吸（30:2）',
    '保持目标节奏（100-120 次/分钟）',
    '双手居中、手臂伸直',
  ],
  commonMistakes: [
    '跳过现场安全评估',
    '检查呼吸时间过长（>10 秒）',
    '按压频率低于 100 次/分钟',
    '按压频率高于 120 次/分钟',
    '按压时肘关节弯曲',
    '胸廓回弹不充分',
    '因暂停过多导致按压分数偏低',
  ],
  escalationConditions: [
    '手部多次脱离摄像头视野',
    '按压频率持续偏离目标范围',
    '按压分数低于 60%',
    '身体姿势长时间不规范',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

const ADVANCED_SCENARIO: CprScenario = {
  id: 'adult-bls-advanced',
  title: '高级急救响应',
  difficulty: 'Advanced',
  trainingMode: 'CONVENTIONAL_30_2',
  emergencyType: '复杂场景 BLS 流程',
  background:
    '你是一名急救人员，在一场大型活动中，一名成人在主舞台附近突然倒地。现场嘈杂、旁观者慌乱，最近的 AED 在 3 分钟路程外。请在压力环境下完成完整的 BLS 流程，在多个 2 分钟周期中保持高质量的胸外按压。',
  requiredFirstSteps: [
    '确认现场安全',
    '检查意识反应（拍肩呼唤）',
    '拨打 120 / 启动急救系统',
    '检查呼吸（看-听-感觉）',
    '开始胸外按压',
    '实施人工呼吸（30:2）',
    '保持目标节奏（100-120 次/分钟）',
    '双手居中、手臂伸直',
  ],
  commonMistakes: [
    '在混乱环境中跳过现场安全评估',
    '未能指派旁观者协助',
    '多个周期后按压节奏衰退',
    '因疲劳导致胸廓回弹不充分',
    '后续周期按压深度变浅',
    '因暂停过多导致按压分数偏低',
  ],
  escalationConditions: [
    '跨周期频率一致性低于 50',
    '第一周期后按压深度下降',
    '按压分数低于 60%',
    '后续周期姿势质量明显下降',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

/** All available scenarios */
const ALL_SCENARIOS: CprScenario[] = [
  BEGINNER_SCENARIO,
  INTERMEDIATE_SCENARIO,
  ADVANCED_SCENARIO,
];

/** Load the default (beginner) scenario – backward compatible */
export function loadCprScenario(): CprScenario {
  return BEGINNER_SCENARIO;
}

/** Load a scenario by its id. Falls back to beginner if not found. */
export function loadCprScenarioById(id: string): CprScenario {
  return ALL_SCENARIOS.find(s => s.id === id) ?? BEGINNER_SCENARIO;
}

/** Load all available scenarios */
export function loadAllCprScenarios(): CprScenario[] {
  return [...ALL_SCENARIOS];
}
