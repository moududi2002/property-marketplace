// 📍 /apps/api/src/modules/properties/properties.module.ts

import { Module } from "@nestjs/common";
import { PropertiesController } from "./properties.controller";
import { PropertiesService } from "./properties.service";
import { PublicPropertiesController } from "./public-properties.controller";
import { PublicPropertiesService } from "./public-properties.service";

@Module({
  controllers: [PropertiesController, PublicPropertiesController],
  providers: [PropertiesService, PublicPropertiesService],
  exports: [PropertiesService, PublicPropertiesService],
})
export class PropertiesModule {}