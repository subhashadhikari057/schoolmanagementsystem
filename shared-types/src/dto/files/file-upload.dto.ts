import { FileStatus } from "../../enums/files/file-status.enum";
import { FileType } from "../../enums/files/file-type.enum";

export interface FileUploadDto {
  id: string;
  filename: string;
  type: FileType;
  status: FileStatus;
  size: number;
  created_at: Date;
}
