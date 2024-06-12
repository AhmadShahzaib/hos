import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MessagePatternResponseType } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { mapMessagePatternResponseToException } from '@shafiqrathore/logeld-tenantbackend-common-future';

import { getTimeZoneDateRangeForDay } from '@shafiqrathore/logeld-tenantbackend-common-future';

import LogsDocument from 'mongoDb/document/document';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { AppService } from './app.service';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { InjectModel } from '@nestjs/mongoose';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import editInsertLogHistory from 'mongoDb/document/editInsertLogHistoryDocument';
import { paginator } from 'utils/pagination';
@Injectable({ scope: Scope.DEFAULT })
export class LogsService {
  private readonly logger = new Logger('HOSLogsService');

  constructor(
    @Inject('AppService') private readonly appService: AppService,
    @Inject('VEHICLE_SERVICE') private readonly client: ClientProxy,
    @InjectModel('EditInsertLogs')
    private editInsertLogsModel: Model<EditInsertLogsDocument>,
    @InjectModel('EditInsertLogHistory')
    private editInsertLogHistoryModel: Model<editInsertLogHistory>,
  ) {}

  /**
   *
   * @description This function is to restore data of all status objects from the current in memory calculated data.
   * To be used when a db entry is found and its data has been restored to in memory calculator class instance.
   */

  getContinuedStatusLogs = (logs) => {
    const sortedLogs = logs.sort((a, b) => a['actionDate'] - b['actionDate']);
    const onGoingArray = [];
    const lastEntryFound = false;
    for (let i = sortedLogs.length - 1; i >= 0 && !lastEntryFound; i--) {
      const l = sortedLogs[i];
      const std = l.get('statusesData')['_doc'];
      const lastEntryFound = Object.keys(std).reduce(
        (res, curr) => res || std[curr].hasOwnProperty('lastStartedAt'),
        false,
      );
      if (!lastEntryFound) {
        onGoingArray.push(sortedLogs[i]);
      } else {
        break;
      }
    }
    return onGoingArray.reverse();
  };

  /**
   * Edit Insert Logs - V2
   * Author : Farzan
   */
  editInsertLogs = async (isEdit, logs) => {
    let response;

    let obj;
    if (!isEdit) {
      obj = await this.editInsertLogsModel.create(logs);
    } else {
      obj = await this.editInsertLogsModel.findOneAndUpdate(
        { _id: isEdit._id },
        logs,
        { new: true },
      );
    }

    if (obj) {
      response = {
        statusCode: 201,
        message: 'Correction recorded!',
        data: obj,
      };
      return response;
    }
    response = {
      statusCode: 400,
      message: 'Something went wrong while creating correction request!',
      data: {},
    };
    return response;
  };

  /**
   * isEditInsertReqExists - V2
   * Author : Farzan
   */
  isEditInsertReqExists = async (dateTime: Date, driverId: string) => {
    console.group(`date -------- `, {
      driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });
    const isEdit = await this.editInsertLogsModel.findOne({
      driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });
    if (isEdit) {
      return isEdit;
    }
    return isEdit;
  };
  /**
   * get all pending edit insert requests - V2
   * Author : Farzan
   */
  getPendingRequests = async (driverInfo) => {
    const isEdit = await this.editInsertLogsModel
      .find({
        driverId: driverInfo.id,
        isApproved: 'pending',
        // requestStatus: { $in: ['Sent'] },
      })
      .lean();

    return isEdit;
  };
  /**
   * responseToEditInsertLog - V2
   * Author : Farzan
   */
  responseToEditInsertLog = async (
    driver,
    dateTime,
    isApproved,
    statusStr,
    notificationStatus,
  ) => {
    const editReq = await this.editInsertLogsModel.findOne({
      // driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });

    if (editReq) {
      editReq.isApproved = isApproved;
      editReq.requestStatus = notificationStatus;
      editReq.status = statusStr;
      editReq.action = isApproved == 'confirm' ? 'Accept' : 'Reject';
      await editReq.save();

      return {
        statusCode: 200,
        message: `Edit request ${
          isApproved == 'confirm' ? 'confirmed' : 'cancelled'
        } successfully!`,
        data: editReq,
      };
    }
    return {
      statusCode: 200,
      message: `Edit insert log not found!`,
      data: {},
    };
  };

  /**
   * Fetch EditInsertLog history - V2
   * Author : Farzan
   */
  editInsertLogHistory = async (query) => {
    const { skip, limit } = paginator(query);
    console.log(`driverid check ===== `, query.driverId);

    const obj = await this.editInsertLogHistoryModel.aggregate([
      {
        $match: {
          driverId: query.driverId,
        },
      },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: JSON.parse(limit) }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    const results = obj[0]?.paginatedResults;
    const total = obj[0]?.totalCount[0]?.total;

    if (obj[0].totalCount.length > 0) {
      return {
        statusCode: 200,
        message: `Edit insert log history fetched!`,
        data: results,
        pageNo: JSON.parse(query.pageNo),
        last_page: Math.ceil(total / limit),
        total: total,
      };
    }
    return {
      statusCode: 404,
      message: `Edit insert log history not available!`,
      data: results,
      pageNo: JSON.parse(query.pageNo),
      last_page: Math.ceil(total / limit) || query.pageNo,
      total: total || 0,
    };
  };

  /**
   * History of edit insert logs - V2
   * Author : Farzan
   */
  maintainHistory = async (object) => {
    try {
      const histCreated = await this.editInsertLogHistoryModel.create(object);
      return histCreated ? true : false;
    } catch (error) {
      console.log(
        `Error in maintaining history --------------- `,
        error.message,
      );
    }
  };
}
