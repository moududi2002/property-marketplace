// 📍 /apps/api/src/modules/locations/locations.controller.ts

import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { LocationsService, type LocationNode } from "./locations.service";

@ApiTags("locations")
@Controller("locations")
@Public()
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get("tree")
  @ApiOperation({ summary: "Full location tree (divisions → districts)" })
  async tree(): Promise<{ locations: LocationNode[] }> {
    return { locations: await this.locations.tree() };
  }

  @Get("divisions")
  @ApiOperation({ summary: "List of divisions" })
  async divisions(): Promise<{ divisions: LocationNode[] }> {
    return { divisions: await this.locations.divisions() };
  }

  @Get("divisions/:slug/districts")
  @ApiOperation({ summary: "Districts within a division" })
  async districts(
    @Param("slug") slug: string,
  ): Promise<{ districts: LocationNode[] }> {
    return { districts: await this.locations.districtsOfDivision(slug) };
  }

  @Get("districts/:slug/upazilas")
  @ApiOperation({ summary: "Upazilas within a district" })
  async upazilas(
    @Param("slug") slug: string,
  ): Promise<{ upazilas: LocationNode[] }> {
    return { upazilas: await this.locations.upazilasOfDistrict(slug) };
  }
}