import { Get, SetMetadata } from "@nestjs/common";
import { ApiExtraModels, ApiParam } from "@nestjs/swagger";
import { CombineDecoratorType, CombineDecorators,HOS} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from "models/logEntry.request.model";

export function GetClockDataDecoratorDriver() {
    const GetClockDataDecorator: Array<CombineDecoratorType> = [
        Get('clock'),
        ApiParam({
            name: 'driverId',
            allowEmptyValue: false,
        }),
    ];
    return CombineDecorators(GetClockDataDecorator);
};

export function GetClockDataDecoratorBackOffice() {
    const GetClockDataDecorator: Array<CombineDecoratorType> = [
        Get('clock/:driverId'),
        SetMetadata('permissions', [HOS.CLOCK]),
        ApiParam({
            name: 'driverId',
            allowEmptyValue: false,
        }),
    ];
    return CombineDecorators(GetClockDataDecorator);
};