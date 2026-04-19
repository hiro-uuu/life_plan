/**
 * 教育費プリセット（円、年額）。
 *
 * 出典の概算値:
 * - 文部科学省「子供の学習費調査（令和3年度）」
 * - 文部科学省「国公私立大学の授業料等調査」
 *
 * 各値は家庭ごとに変動するため、UI の override で上書き可能。
 * 本ファイルの値は使用者が自由に編集してよい（出典はあくまで初期目安）。
 */
import type { EducationStage, SchoolType } from '@/types/child';

export const EDUCATION_COST_PRESET: Record<EducationStage, Record<SchoolType, number>> = {
  daycare: {
    public: 300_000,
    private: 500_000,
  },
  elementary: {
    public: 350_000,
    private: 1_670_000,
  },
  juniorHigh: {
    public: 540_000,
    private: 1_440_000,
  },
  highSchool: {
    public: 510_000,
    private: 1_050_000,
  },
  university: {
    public: 820_000,
    private: 1_500_000,
  },
};

export const EDUCATION_STAGE_LABELS: Record<EducationStage, string> = {
  daycare: '保育園 (0-5)',
  elementary: '小学校 (6-11)',
  juniorHigh: '中学校 (12-14)',
  highSchool: '高校 (15-17)',
  university: '大学 (18-21)',
};
