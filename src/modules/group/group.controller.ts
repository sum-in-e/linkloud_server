import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { GroupsService } from 'src/modules/group/group.service';

@ApiTags('그룹 APIs')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  @ApiOperation({ summary: '그룹별 링크 개수 조회' })
  @Get('count')
  async getGroupsCount(@Req() request: RequestWithUser) {
    const user = request.user;
    const result = await this.groupsService.getGroupsCountByUser(user);

    return {
      ...result,
    };
  }
}
