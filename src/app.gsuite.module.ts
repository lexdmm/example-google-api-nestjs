import { Module } from '@nestjs/common';
import { AppController } from './app.gsuite.controller';
import { AppGsuiteService } from './app.gsuite.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppGsuiteService],
})
export class AppGsuiteModule {}
