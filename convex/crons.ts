import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch fee rates", { hours: 6 }, internal.fetcher.fetchAllFees);

crons.interval(
  "fetch funding rates",
  { hours: 1 },
  internal.funding.fetchFundingRates,
);

crons.interval("check fee alerts", { hours: 6 }, internal.alerts.checkAlerts);

export default crons;
