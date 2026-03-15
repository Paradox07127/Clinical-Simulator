export interface PhysicalExamFinding {
  system: string;
  finding: string;
}

export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  initialComplaint: string;
  hiddenDetails: {
    duration: string;
    triggers: string;
    pastHistory: string;
    associatedSymptoms: string;
    lifestyle: string;
    familyHistory?: string;
    drugHistory?: string;
    reviewOfSystems?: string;
  };
  physicalExam: PhysicalExamFinding[];
  correctDiagnosis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  differentials: string[];
  redFlags: string[];
  mustAskItems: MustAskItem[];
  personality?: string;
  speechPatterns?: string[];
}

export interface MustAskItem {
  dimension: CoverageDimension;
  subItem: string;
  critical: boolean;
  hint?: string;
}

export type CoverageDimension =
  | 'HPC'   // History of Presenting Complaint
  | 'PMH'   // Past Medical History
  | 'DH'    // Drug History
  | 'FH'    // Family History
  | 'SH'    // Social History
  | 'ROS'   // Review of Systems
  | 'ICE'   // Ideas, Concerns, Expectations
  | 'COMM'; // Communication / Rapport
