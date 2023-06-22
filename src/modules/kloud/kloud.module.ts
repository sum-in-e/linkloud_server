import { Module, forwardRef } from '@nestjs/common';
import { KloudController } from './kloud.controller';
import { KloudService } from './kloud.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { LinkModule } from 'src/modules/link/link.module';
import { UserModule } from 'src/modules/user/user.module';
import { KloudRepository } from 'src/modules/kloud/repository/kloud.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Kloud]), forwardRef(() => UserModule), forwardRef(() => LinkModule)],
  controllers: [KloudController],
  providers: [KloudService, KloudRepository],
  exports: [KloudRepository, KloudService],
})
export class KloudModule {}
