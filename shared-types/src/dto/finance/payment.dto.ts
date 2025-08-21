import { PaymentStatus } from "../../enums/finance/payment-status.enum";
import { PaymentMethod } from "../../enums/finance/payment-method.enum";

export interface PaymentDto {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: Date;
}
