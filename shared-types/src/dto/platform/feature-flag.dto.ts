import { FeatureFlagStatus } from "../../enums/platform/feature-flag-status.enum";

export interface FeatureFlagDto {
  id: string;
  name: string;
  key: string;
  status: FeatureFlagStatus;
  description?: string;
}
