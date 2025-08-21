import { ResultStatus } from "../../enums/exam/result-status.enum";

export interface ResultDto {
  id: string;
  exam_id: string;
  student_id: string;
  marks: number;
  status: ResultStatus;
}
