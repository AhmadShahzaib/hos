export default interface editInsertLogHistory extends Document {
  driverId: String;
  driver: {
    id: { type: String };
    name: { type: String };
  };
  editedBy: {};
  dateTime: String;
  status: {
    type: String;
  };
  isApproved: String;
}