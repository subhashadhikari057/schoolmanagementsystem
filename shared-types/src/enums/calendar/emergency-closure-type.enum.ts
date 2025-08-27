/**
 * =============================================================================
 * Emergency Closure Type Enum
 * =============================================================================
 * Defines the types of emergency closures available in the system.
 * =============================================================================
 */

export enum EmergencyClosureType {
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  STRIKE = 'STRIKE',
  PANDEMIC = 'PANDEMIC',
  POWER_OUTAGE = 'POWER_OUTAGE',
  SECURITY_CONCERN = 'SECURITY_CONCERN',
  INFRASTRUCTURE_DAMAGE = 'INFRASTRUCTURE_DAMAGE',
  WEATHER_EMERGENCY = 'WEATHER_EMERGENCY',
  OTHER = 'OTHER',
}

/**
 * Display labels for emergency closure types
 */
export const EmergencyClosureTypeLabels: Record<EmergencyClosureType, string> = {
  [EmergencyClosureType.NATURAL_DISASTER]: 'Natural Disaster',
  [EmergencyClosureType.STRIKE]: 'Strike/Bandh',
  [EmergencyClosureType.PANDEMIC]: 'Pandemic/Health Emergency',
  [EmergencyClosureType.POWER_OUTAGE]: 'Power Outage',
  [EmergencyClosureType.SECURITY_CONCERN]: 'Security Concern',
  [EmergencyClosureType.INFRASTRUCTURE_DAMAGE]: 'Infrastructure Damage',
  [EmergencyClosureType.WEATHER_EMERGENCY]: 'Weather Emergency',
  [EmergencyClosureType.OTHER]: 'Other Emergency',
};

/**
 * Type guard to check if a value is a valid EmergencyClosureType
 */
export function isEmergencyClosureType(value: any): value is EmergencyClosureType {
  return Object.values(EmergencyClosureType).includes(value);
}

/**
 * Get emergency closure icon for UI display
 */
export const EmergencyClosureIcons: Record<EmergencyClosureType, string> = {
  [EmergencyClosureType.NATURAL_DISASTER]: '🌪️',
  [EmergencyClosureType.STRIKE]: '✊',
  [EmergencyClosureType.PANDEMIC]: '🦠',
  [EmergencyClosureType.POWER_OUTAGE]: '⚡',
  [EmergencyClosureType.SECURITY_CONCERN]: '🚨',
  [EmergencyClosureType.INFRASTRUCTURE_DAMAGE]: '🏗️',
  [EmergencyClosureType.WEATHER_EMERGENCY]: '🌨️',
  [EmergencyClosureType.OTHER]: '⚠️',
};
