// 📍 /apps/api/src/modules/inquiries/dto/create-inquiry.dto.ts

import { createZodDto } from "nestjs-zod";
import { createInquirySchema } from "@property-marketplace/validation";

export class CreateInquiryDto extends createZodDto(createInquirySchema) {}