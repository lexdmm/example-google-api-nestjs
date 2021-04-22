import { Controller, Get } from '@nestjs/common';
import { AppGsuiteService } from './app.gsuite.service';

@Controller()
export class AppController {
  constructor(private readonly appGsuiteService: AppGsuiteService) {}

  @Get()
  getHello(): string {
    return this.appGsuiteService.getUsers();
  }
}
