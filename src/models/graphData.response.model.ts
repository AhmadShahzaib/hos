import { ApiPropertyOptional } from '@nestjs/swagger';
import { GraphDataType } from './GraphData.type';

class GraphDataTypesWithUpdate extends GraphDataType {
  @ApiPropertyOptional()
  updated?: GraphDataType
}
class GraphDataTypesWithEditRequest extends GraphDataType {
  @ApiPropertyOptional()
  editRequest?: GraphDataType
}
export class GraphDataResponseModel extends GraphDataType {

  @ApiPropertyOptional()
  updated: GraphDataTypesWithUpdate
  @ApiPropertyOptional()
  editRequest: GraphDataTypesWithEditRequest

  constructor(graphData: GraphDataType) {
    super()
    this.status = graphData.status;
    this.startedAt = graphData.startedAt;
    this.lastStartedAt = graphData.lastStartedAt;
    this.totalSecondsSpendSoFar = graphData.totalSecondsSpendSoFar;
    this.actionDate = graphData.actionDate;
    this.odoMeterMillage = graphData.odoMeterMillage;
    this.odoMeterSpeed = graphData.odoMeterSpeed;
    this.engineHours = graphData.engineHours;
    this.vehicleManualId = graphData.vehicleManualId;
    this.address = graphData.address;
    this.driver = graphData.driver;
    this.violations = graphData.violations;
    this.id = graphData.id;
    this.updated = graphData;
    this.editRequest = graphData;
  }
}
