export interface AttendanceData {
  day: string;
  students: number;
  teachers: number;
}

const attendanceData: AttendanceData[] = [
  { day: "Sun", students: 80, teachers: 20 },
  { day: "Mon", students: 90, teachers: 10 },
  { day: "Tues", students: 75, teachers: 25 },
  { day: "Wed", students: 85, teachers: 15 },
  { day: "Thu", students: 95, teachers: 5 },
  { day: "Fri", students: 80, teachers: 20 },
];

export default attendanceData;


