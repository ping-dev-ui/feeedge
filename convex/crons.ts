import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "fetch fee rates",
  { hours: 6 },
  internal.fetcher.fetchAllFees,
);

export default crons;