import { Module, forwardRef } from '@nestjs/common';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from 'src/modules/link/entities/link.entity';
import { CloudModule } from 'src/modules/cloud/cloud.module';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Link]), forwardRef(() => UserModule), forwardRef(() => CloudModule)],
  controllers: [LinkController],
  providers: [LinkService],
  exports: [],
})
export class LinkModule {}
