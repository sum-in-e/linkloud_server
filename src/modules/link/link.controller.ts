import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LinkService } from 'src/modules/link/link.service';

@ApiTags('유저 APIs')
@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Get('analyze')
  async analyze(@Query('url') url: string) {
    return await this.linkService.linkAnalyze(url);
  }
}
