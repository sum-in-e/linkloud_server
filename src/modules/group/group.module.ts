import { Module } from '@nestjs/common';
import { GroupsController } from './group.controller';
import { GroupsService } from './group.service';
import { CloudModule } from 'src/modules/cloud/cloud.module';
import { LinkModule } from 'src/modules/link/link.module';

@Module({
  imports: [CloudModule, LinkModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
