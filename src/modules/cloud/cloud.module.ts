import { Module, forwardRef } from '@nestjs/common';
import { CloudController } from './cloud.controller';
import { CloudService } from './cloud.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { LinkModule } from 'src/modules/link/link.module';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cloud]), forwardRef(() => UserModule), forwardRef(() => LinkModule)],
  controllers: [CloudController],
  providers: [CloudService],
  exports: [],
})
export class CloudModule {}