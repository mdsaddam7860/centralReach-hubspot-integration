import { logger } from "../index.js";
import { getHSAxios } from "../configs/hubspot.config.js";
import { hubspotExecutor } from "../utils/executors.js";
async function* hubspotGenerator(
  endpoint,
  {
    axiosInstance = getHSAxios(),
    executor = hubspotExecutor,
    log = logger,
  } = {}
) {
  let after = undefined;
  let pageCount = 0;
  let totalProcessed = 0;
  const startTime = Date.now();

  try {
    do {
      pageCount++;

      const response = await executor(
        async () => {
          return await axiosInstance.get(endpoint, {
            params: { limit: 100, after },
          });
        },
        { endpoint, page: pageCount }
      );

      const records = response.data?.results || [];

      totalProcessed += records.length;

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const recordsPerSecond =
        elapsedSeconds > 0
          ? (totalProcessed / elapsedSeconds).toFixed(2)
          : "0.00";

      yield {
        records,
        stats: {
          page: pageCount,
          totalProcessed,
          recordsPerSecond,
          elapsedSeconds: elapsedSeconds.toFixed(1),
        },
      };

      after = response.data?.paging?.next?.after;

      // log.info(`[HubSpot Progress] ${endpoint}`, {
      //   page: pageCount,
      //   processed: totalProcessed,
      //   speed: `${recordsPerSecond} rec/sec`,
      // });
    } while (after);
  } catch (error) {
    log.error(`Stream interrupted at page ${pageCount}`, {
      status: error.response?.status,
      response: error.response?.data,
      method: error.config?.method,
      url: error.config?.url,
      headers: error.config?.headers,
    });
    throw error;
  }
}

async function syncContact({ log = logger } = {}) {
  try {
    const contactStream = hubspotGenerator("/crm/v3/objects/contacts");

    for await (const { records, stats } of contactStream) {
      log.info(`Processing a batch of ${records.length} Contacts...`);
      log.info(`Stats: ${JSON.stringify(stats, null, 2)}`);
    }
  } catch (error) {
    log.error("❌ Error processing Contact in Batch", error);
  }
}

export { syncContact };
