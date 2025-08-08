export const formatTimeSlot = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

export const formatTeacherName = (
  firstName: string,
  lastName: string,
): string => {
  return `${firstName} ${lastName}`;
};

export const formatRoomNumber = (roomNumber: string): string => {
  return `Room ${roomNumber}`;
};

export const formatWeeklyHours = (hours: number): string => {
  return `Weekly Hours: ${hours}`;
};

export const formatSubjectCount = (count: number): string => {
  return `Subjects: ${count}`;
};

export const formatLastUpdated = (date: Date): string => {
  return `Last Updated: ${date.toLocaleDateString()}`;
};

export const formatGradeSection = (grade: string, section: string): string => {
  return `${grade} - Section ${section}`;
};
