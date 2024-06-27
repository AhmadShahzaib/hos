import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'dto/pagination.dto';
import UnidentifiedLogsDocument from 'mongoDb/document/unidentifiedLog.document';
import { Model, Types } from 'mongoose';
import { paginator } from 'utils/pagination';

@Injectable()
export class UnidentifiedLogsService {
  constructor(
    @InjectModel('UnidentifiedLogs')
    private unidentifiedLogsModel: Model<UnidentifiedLogsDocument>, // @InjectModel('Units'), // @Inject('UNIT_SERVICE'
  ) {}

  respond = async (object) => {
    const unidentifiedLog = await this.unidentifiedLogsModel.findOne({
      eventSequenceIdNumber: object.eventSequenceIdNumber,
      eldNumber: object.eldNumber,
    });
    if (!unidentifiedLog) {
      return {
        statusCode: 200,
        message: 'Log not found!',
        data: {},
      };
    }

    // isAccepted = 0 -- represents cancel
    // isAccepted = 1 -- represents confirm

    if (object.isAccepted == 1) {
      unidentifiedLog.driverId = object.driverId;
      unidentifiedLog.type = 'unidentified-accepted';
    } else {
      unidentifiedLog.rejected.push(object.driverId);
      unidentifiedLog.driverId = 'unidentified';
      unidentifiedLog.type = 'unidentified-unassigned';
    }
    unidentifiedLog.reason = object.reason || '';
    unidentifiedLog.origin = object.origin || {
      longitude: '0.0',
      latitude: '0.0',
      address: '',
    };
    unidentifiedLog.destination = object.destination || {
      longitude: '0.0',
      latitude: '0.0',
      address: '',
    };

    await unidentifiedLog.save();

    return {
      statusCode: 200,
      message: 'Response against the log recorded.',
      isAccepted: object.isAccepted == 1 ? true : false,
      data: unidentifiedLog,
    };
  };

  cancel = async (object) => {
    const unidentifiedLog = await this.unidentifiedLogsModel.findOne({
      _id: object.unidentifiedLogId,
    });
    if (!unidentifiedLog) {
      return {
        statusCode: 200,
        message: 'Log not found!',
        data: {},
      };
    }
    const currentDriver = unidentifiedLog.driverId;
    unidentifiedLog.driverId = 'unidentified';
    unidentifiedLog.type = 'unidentified-unassigned';
    await unidentifiedLog.save();

    return {
      statusCode: 200,
      message: 'Unidenitfied log assignment cancelled successfully!.',
      data: unidentifiedLog,
      currentDriver: currentDriver,
    };
  };

  findAll = async (query, options) => {
    const { skip, limit } = paginator(query);

    const obj = await this.unidentifiedLogsModel.aggregate([
      {
        $match: options,
      },
      {
        $addFields: {
          id: '$_id', // Add the virtual 'id' field using the '_id' value
        },
      },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: JSON.parse(limit) }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    let results = [];
    let total;
    if (obj.length > 0) {
      results = obj[0]?.paginatedResults;
      total = obj[0]?.totalCount[0]?.total;
    }

    if (results.length < 1) {
      const response = {
        statusCode: 200,
        message: 'No logs available!',
        data: results,
        pageNo: JSON.parse(query.pageNo),
        last_page: Math.ceil(total / limit),
        total: total,
      };
      return response;
    }

    const response = {
      statusCode: 200,
      message: 'Logs fetched successfully!',
      data: results,
      pageNo: JSON.parse(query.pageNo),
      last_page: Math.ceil(total / limit),
      total: total,
    };

    return response;
  };
  findAllVin = async (query, options) => {
    // const { skip, limit } = paginator(query);

    const obj = await this.unidentifiedLogsModel.aggregate([
      {
        $match: options,
      },
      {
        $addFields: {
          id: '$_id', // Add the virtual 'id' field using the '_id' value
        },
      },
    ]);

    const results = obj;
    // let total;
    // if (obj.length > 0) {
    //   results = obj[0]?.paginatedResults;
    //   total = obj[0]?.totalCount[0]?.total;
    // }

    if (results.length < 1) {
      const response = {
        statusCode: 200,
        message: 'No logs available!',
        data: results,
      };
      return response;
    }

    const response = {
      statusCode: 200,
      message: 'Logs fetched successfully!',
      data: results,
    };

    return response;
  };
  create = async (logs) => {
    const obj = [];
    for (let i = 0; i < logs.length; i++) {
      const doc = await this.unidentifiedLogsModel.create(logs[i]);
      obj.push(doc);
    }
    if (obj.length > 0) {
      const response = {
        statusCode: 200,
        message: 'Log created successfully!',
        data: obj,
      };
      return response;
    }

    const response = {
      statusCode: 400,
      message: 'Something went wrong!',
      data: {},
    };
    return response;
  };

  fetchUnidentifiedConsumedTime = async () => {
    const result = await this.unidentifiedLogsModel.aggregate([
      {
        $match: {
          type: {
            $in: [
              'unidentified-unassigned',
              'unidentified-assigned',
              'unidentified-accepted',
            ],
          }, // Match the three types
        },
      },
      {
        $group: {
          _id: '$type', // Group all documents together
          totalTime: { $sum: '$accumulatedEngineHours' }, // Calculate the sum of the time field
        },
      },
    ]);
    result.push({ _id: 'unidentified-total', totalTime: 0 }); // for total time accumulated by all 3 types, adding 4th field

    let response;
    let unidentifiedTotal = 0;
    for (let i = 0; i < result.length; i++) {
      let key = `${result[i]._id}`;
      unidentifiedTotal = unidentifiedTotal + result[i].totalTime; // accumulating total hours on each iteration

      if (key == 'unidentified-total') {
        result[i].totalTime = unidentifiedTotal;
      }
      key = key.replace('-', '_');

      const hours = Math.floor(result[i].totalTime);
      const minutes = (
        (result[i].totalTime - Math.floor(result[i].totalTime)) *
        60
      ).toFixed();
      const value = `${hours}h ${minutes}m`;
      // let value =
      //   hours && Number(minutes) > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      response = {
        ...response,
        [key]: value,
      };
    }

    return {
      statusCode: 200,
      message: 'Accumulated time fetched successfully!',
      data: response,
    };
  };

  findById = async (id) => {
    const obj = await this.unidentifiedLogsModel.findById({ _id: id });
    console.log(`obj ================= `, obj);

    if (!obj) {
      const response = {
        statusCode: 404,
        message: 'No log available!',
        data: {},
      };
      return response;
    }
    const response = {
      statusCode: 200,
      message: 'Log fetched successfully!',
      data: obj,
    };
    return response;
  };

  updateById = async (id, object) => {
    const obj = await this.unidentifiedLogsModel.findOne({
      _id: id,
    });
    console.log(`obj =============== `, obj);

    if (obj.type == 'unidentified-unassigned') {
      if (obj) {
        obj.driverId = object.driverId;
        obj.statusCode = object.statusCode;
        obj.reason = object.reason;
        obj.type = 'unidentified-assigned';
        obj.origin.address = object.originAddress;
        obj.destination.address = object.destinationAddress;
        obj.eventCode= object.eventCode;
        obj.eventType= object.eventType;

        await obj.save();

        const response = {
          statusCode: 200,
          message: 'Unassign log assigned successfully!',
          data: obj,
        };
        return response;
      }
    } else {
      const response = {
        statusCode: 200,
        message:
          'This unidentified log is already assigned, cancel the assignment first to reassign the log.',
        data: {},
      };
      return response;
    }

    const response = {
      statusCode: 400,
      message: 'Something went wrong!',
      data: {},
    };
    return response;
  };

  deleteById = async (id) => {
    const obj = await this.unidentifiedLogsModel.deleteOne({ _id: id });
    if (obj.acknowledged) {
      const response = {
        statusCode: 200,
        message: 'Log deleted successfully!',
        data: {},
      };
      return response;
    }

    const response = {
      statusCode: 400,
      message: 'Something went wrong!',
      data: {},
    };
  };

  findAllUnidentified = async (ids) => {
    const response = await this.unidentifiedLogsModel.find({
      _id: {
        $in: ids,
      },
    });
    return response;
  };

  deleteMany = async (ids) => {
    try {
      // Perform the updateMany operation to set isDeleted to true for the given IDs
      const result = await this.unidentifiedLogsModel.updateMany(
        {
          _id: {
            $in: ids,
          },
        },
        {
          $set: { isDeleted: true },
        },
      );

      // Check the modified count and prepare the response
      if (result.modifiedCount > 0) {
        return {
          statusCode: 200,
          message: 'Logs deleted successfully!',
          data: {},
        };
      } else {
        return {
          statusCode: 404,
          message: 'Not Found!',
          data: {},
        };
      }
    } catch (error) {
      // Handle any errors that occurred during the update
      return {
        statusCode: 500,
        message: 'Internal Server Error',
        data: { error: error.message },
      };
    }
  };

  /**
   * Edit Inset Logs
   * Description:
   *            Fetch all edit logs against a vehicleVim
   */
  fetchLogsAgainstVim = async (vinNo: string, query: PaginationDto) => {
    const { skip, limit } = paginator(query);

    const unidentifiedAgainstVim = await this.unidentifiedLogsModel
      .find({
        cmvVin: vinNo,
      })
      .skip(skip)
      .limit(limit);
    if (unidentifiedAgainstVim.length < 1) {
      return {
        statusCode: 200,
        message: 'No results against such Vin!',
        data: [],
      };
    }
    return {
      statusCode: 200,
      message: 'Results against Vin fetched successfully!',
      data: unidentifiedAgainstVim,
    };
  };
}
