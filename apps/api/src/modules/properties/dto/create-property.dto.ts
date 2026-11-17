// 📍 /apps/api/src/modules/properties/dto/create-property.dto.ts
//
// Reuses the shared draft schema. Every field is optional — a seller
// can create an empty draft and fill it in over multiple visits.

import { createZodDto } from "nestjs-zod";
import { propertyDraftSchema } from "@property-marketplace/validation";

export class CreatePropertyDto extends createZodDto(propertyDraftSchema) {}