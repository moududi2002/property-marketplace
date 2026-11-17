// 📍 /apps/api/src/modules/inquiries/inquiries.module.ts

import { Module } from "@nestjs/common";
import { AdminInquiriesController } from "./admin-inquiries.controller";
import { InquiriesController } from "./inquiries.controller";
import { InquiriesService } from "./inquiries.service";

@Module({
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
  exports: [InquiriesService],
})
export class InquiriesModule {}