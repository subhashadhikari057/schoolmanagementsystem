import { AchievementType } from '../../enums/achievements/achievement-type.enum';

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  student_id: string;
  awarded_at: Date;
}