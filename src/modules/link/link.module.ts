import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from 'src/modules/link/entities/link.entity';
import { CloudModule } from 'src/modules/cloud/cloud.module';
import { UserModule } from 'src/modules/user/user.module';
import { LinkAnalyzeService } from 'src/modules/link/link-analyze.service';
import { LinkController } from 'src/modules/link/link.controller';
import { LinkService } from 'src/modules/link/link.service';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Link]), forwardRef(() => UserModule), forwardRef(() => CloudModule)],
  controllers: [LinkController],
  providers: [LinkService, LinkAnalyzeService, LinkRepository],
  exports: [LinkService],
})
export class LinkModule {}
