import { Module } from '@nestjs/common';
import { GroupsController } from './group.controller';
import { GroupsService } from './group.service';
import { KloudModule } from 'src/modules/kloud/kloud.module';
import { LinkModule } from 'src/modules/link/link.module';

@Module({
  imports: [KloudModule, LinkModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
