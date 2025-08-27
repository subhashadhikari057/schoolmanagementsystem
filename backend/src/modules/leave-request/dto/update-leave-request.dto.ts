import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveRequestDto } from './create-leave-request.dto';

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) {}
