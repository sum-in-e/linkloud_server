import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from 'src/modules/link/entities/link.entity';
import { KloudModule } from 'src/modules/kloud/kloud.module';
import { UserModule } from 'src/modules/user/user.module';
import { LinkAnalyzeService } from 'src/modules/link/link-analyze.service';
import { LinkController } from 'src/modules/link/link.controller';
import { LinkService } from 'src/modules/link/link.service';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Link]), forwardRef(() => UserModule), forwardRef(() => KloudModule)],
  controllers: [LinkController],
  providers: [LinkService, LinkAnalyzeService, LinkRepository],
  exports: [LinkService, LinkRepository],
})
export class LinkModule {}
