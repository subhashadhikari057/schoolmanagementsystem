import { CertificateStatus } from '../../enums/achievements/certificate-status.enum';

export interface CertificateDto {
  id: string;
  title: string;
  student_id: string;
  status: CertificateStatus;
  issued_at?: Date;
}