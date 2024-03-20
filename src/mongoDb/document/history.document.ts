export default interface HistoryDocument extends Document {
  driver: {
    id: { type: String };
    name: { type: String };
  };
  type: {
    type: String;
    enum: ['correction', 'transfer'];
  };
  csvBeforeUpdate: {};
  csvAfterUpdate: {};
}
