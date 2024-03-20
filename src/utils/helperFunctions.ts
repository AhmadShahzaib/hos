import moment from "moment-timezone";

export const getModelName = async (driverInfo: any, date: number) => {
    const { id, tenantId } = driverInfo;
    const companyTimeZone = driverInfo.homeTerminalTimeZone.tzCode
    const driverId = id || driverInfo?._id;
    const dateYear = moment.tz(moment.unix(date), companyTimeZone).format('YYYY');
    // const dateMonth = moment.tz(moment.unix(date), companyTimeZone).format('MM');
    return `${tenantId}:${driverId}`;
}

export const monthFormatForDynamicCollection = (date: number, timeZone ) => {
    return moment.tz(moment.unix(date), timeZone).format('MM');
}
export const dayFormatForDynamicCollection = (date: number, timeZone ) => {

    return moment.tz(moment.unix(date), timeZone).format('DD');
}