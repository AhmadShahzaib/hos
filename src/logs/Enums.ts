
// Changed the ENUMs to string type as it will be more easily understandable for the endpoint consumers.
export enum LogActionType {
  ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING",
  DRIVING = "DRIVING",
  SLEEPER_BERTH = "SLEEPER_BERTH",
  OFF_DUTY = "OFF_DUTY",
  BREAK = "BREAK",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PERSONAL_CONVEYANCE = "PERSONAL_CONVEYANCE",
  YARD_MOVE = "YARD_MOVE"
}

export enum ViolationType {
  THIRTY_MINUTES_BREAK = "THIRTY_MINUTES_BREAK",
  ELEVEN_HOURS_DRIVE = "ELEVEN_HOURS_DRIVE",
  FOURTEEN_HOURS_SHIFT = "FOURTEEN_HOURS_SHIFT",
  SEVENTY_BY_EIGHT_VIOLATION = "SEVENTY_BY_EIGHT_VIOLATION",
  OTHER = "OTHER",
}


export enum MSToTimeReturnType {
  Hours = "Hours",
  Minutes = "Minutes",
  Seconds = "Seconds",
}

export enum StatusKey {
  ON_DUTY_NOT_DRIVING = "onDuty",
  DRIVING = "onDriving",
  SLEEPER_BERTH = "onSleeperBerth",
  OFF_DUTY = "offDuty",
  BREAK = "break",
  PERSONAL_CONVEYANCE = "onPersonalConveyance",
  YARD_MOVE = "onYardMove"
}

export enum AppDeviceType {
  IOS = "ios",
  ANDROID = "android"
}

export enum EventType {
  PW1 = "EV_POWER_ON",
  PW0 = "EV_POWER_OFF",
  IG1 = "EV_IGNITION_ON",
  IG0 = "EV_IGNITION_OFF",
  EN1 = "EV_ENGINE_ON",
  EN0 = "EV_ENGINE_OFF",
  TR1 = "EV_TRIP_START",
  TR0 = "EV_TRIP_END",
  PER = "EV_PERIODIC",
  BL1 = "EV_BLE_ON",
  BL0 = "EV_BLE_OFF",
  BU1 = "EV_BUS_ON",
  BU0 = "EV_BUS_OFF",
  ACC = "EV_MEMS_ACC",
  BRK = "EV_MEMS_BRK",
  COR = "EV_MEMS_COR",
  "?" = "EV_UNKNOWN"
}