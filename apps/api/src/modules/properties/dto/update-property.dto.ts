// 📍 /apps/api/src/modules/properties/dto/update-property.dto.ts
//
// PATCH semantics — partial draft. Same schema, all fields already optional.

import { createZodDto } from "nestjs-zod";
import { propertyDraftSchema } from "@property-marketplace/validation";

export class UpdatePropertyDto extends createZodDto(propertyDraftSchema.partial()) {}