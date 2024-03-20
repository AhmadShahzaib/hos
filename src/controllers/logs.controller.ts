import { Controller, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from '../services/app.service';

@Controller('HOS/Logs')
@ApiTags('HOS/Logs')
export class LogsController {
  constructor(@Inject('AppService') private readonly HOSService: AppService) {}

 
  // @SetOnDutyDecorators()
  // async SetOnDuty(@Param('id') driverId: string): Promise<Boolean> {
  //   return await this.HOSService.setOnDuty(driverId);
  // }
}
