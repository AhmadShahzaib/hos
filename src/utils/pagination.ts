export const paginator = (query) => {
  let { pageNo, limit } = query;
  if (pageNo == 0) {
    pageNo = 1;
  }
  pageNo = pageNo || 1;
  limit = limit || 10;
  const skip = (pageNo - 1) * limit;
  return { skip, limit };
};
