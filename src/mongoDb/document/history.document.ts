export default interface HistoryDocument extends Document {
  driver: {
    id: { type: string };
    name: { type: string };
  };
  type: {
    type: string;
    enum: ['correction', 'transfer'];
  };
  csvBeforeUpdate: {};
  csvAfterUpdate: {};
}
