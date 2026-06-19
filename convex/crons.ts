import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily refresh: live APIs + Bright Data fee-page scrapes, with curated fallback.
crons.interval("fetch fee rates", { hours: 24 }, internal.fetcher.fetchAllFees);

crons.interval(
  "fetch funding rates",
  { hours: 1 },
  internal.funding.fetchFundingRates,
);

crons.interval("check fee alerts", { hours: 6 }, internal.alerts.checkAlerts);

export default crons;
