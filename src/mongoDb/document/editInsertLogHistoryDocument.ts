export default interface editInsertLogHistory extends Document {
  driverId: string;
  driver: {
    id: { type: string };
    name: { type: string };
  };
  editedBy: {};
  dateTime: string;
  status: {
    type: string;
  };
  isApproved: string;
}