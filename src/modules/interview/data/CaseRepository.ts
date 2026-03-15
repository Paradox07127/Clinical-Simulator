import type { PatientCase } from '../types';
import zhangData from './cases/case-zhang.json';
import liData from './cases/case-li.json';
import wangData from './cases/case-wang.json';

const allCases: PatientCase[] = [
  zhangData as PatientCase,
  liData as PatientCase,
  wangData as PatientCase,
];

export function loadAllCases(): PatientCase[] {
  return allCases;
}

export function getCaseById(id: string): PatientCase | undefined {
  return allCases.find(c => c.id === id);
}

export function getCasesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): PatientCase[] {
  return allCases.filter(c => c.difficulty === difficulty);
}
