import { logger, contactProperties, dealProperties } from "../index.js";
import { getHSAxios } from "../configs/hubspot.config.js";
import { hubspotExecutor } from "../utils/executors.js";
// async function* hubspotGenerator(
//   endpoint,
//   {
//     axiosInstance = getHSAxios(),
//     executor = hubspotExecutor,
//     log = logger,
//   } = {}
// ) {
//   let after = undefined;
//   let pageCount = 0;
//   let totalProcessed = 0;
//   const startTime = Date.now();

//   try {
//     do {
//       pageCount++;

//       const response = await executor(
//         async () => {
//           return await axiosInstance.get(endpoint, {
//             params: { limit: 100, after },
//           });
//         },
//         { endpoint, page: pageCount }
//       );

//       const records = response.data?.results || [];

//       totalProcessed += records.length;

//       const elapsedSeconds = (Date.now() - startTime) / 1000;
//       const recordsPerSecond =
//         elapsedSeconds > 0
//           ? (totalProcessed / elapsedSeconds).toFixed(2)
//           : "0.00";

//       yield {
//         records,
//         stats: {
//           page: pageCount,
//           totalProcessed,
//           recordsPerSecond,
//           elapsedSeconds: elapsedSeconds.toFixed(1),
//         },
//       };

//       after = response.data?.paging?.next?.after;

//       // log.info(`[HubSpot Progress] ${endpoint}`, {
//       //   page: pageCount,
//       //   processed: totalProcessed,
//       //   speed: `${recordsPerSecond} rec/sec`,
//       // });
//     } while (after);
//   } catch (error) {
//     log.error(`Stream interrupted at page ${pageCount}`, {
//       status: error.response?.status,
//       response: error.response?.data,
//       method: error.config?.method,
//       url: error.config?.url,
//       headers: error.config?.headers,
//     });
//     throw error;
//   }
// }

async function* hubspotGenerator(
  endpoint,
  {
    properties = [],
    filterGroups = null,
    axiosInstance = getHSAxios(),
    executor = hubspotExecutor,
    log = logger,
  } = {}
) {
  let after = undefined;
  let pageCount = 0;
  let totalProcessed = 0;
  const startTime = Date.now();

  const isDelta = Array.isArray(filterGroups) && filterGroups.length > 0;

  try {
    do {
      pageCount++;

      const response = await executor(async () => {
        if (isDelta) {
          // 🔥 Use Search API for delta
          return axiosInstance.post(`${endpoint}/search`, {
            filterGroups,
            properties,
            limit: 100,
            after,
          });
        } else {
          // 🔹 Normal list mode
          return axiosInstance.get(endpoint, {
            params: {
              limit: 100,
              after,
              ...(properties.length && {
                properties: properties.join(","),
              }),
            },
          });
        }
      });

      const records = response.data?.results || [];
      totalProcessed += records.length;

      const elapsedSeconds = (Date.now() - startTime) / 1000;

      yield {
        records,
        stats: {
          page: pageCount,
          totalProcessed,
          recordsPerSecond:
            elapsedSeconds > 0
              ? (totalProcessed / elapsedSeconds).toFixed(2)
              : "0.00",
        },
      };

      after = response.data?.paging?.next?.after;
    } while (after);
  } catch (error) {
    log.error("HubSpot Stream Error", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}
async function syncHubspotDealToCentralReachClient() {
  try {
    const lastSyncTime = "2025-12-01T10:00:00.000Z";
    const endpoint = "/crm/v3/objects/deals";

    const filterGroups = [
      {
        filters: [
          {
            propertyName: "hs_lastmodifieddate",
            operator: "GT",
            value: lastSyncTime,
          },
        ],
      },
    ];

    const contactStream = hubspotGenerator(endpoint, {
      properties: dealProperties(),
      filterGroups,
    });

    for await (const { records, stats } of contactStream) {
      await processBatchDealInCentralReach(records);
      logger.info(`[CentralReach Progress] ${endpoint}`, {
        page: stats.page,
        processed: stats.totalProcessed,
        speed: `${stats.recordsPerSecond} rec/sec`,
      });
      // return;
    }
  } catch (error) {
    logger.error("❌ Error processing Deal in Batch", {
      status: error?.status,
      response: error.response?.data,
      method: error?.method,
      url: error?.config?.url,
      headers: error?.config?.headers,
      message: error.message,
    });
  }
}

function processBatchDealInCentralReach(records = {}) {
  try {
    // create deal in central reach as contacts
    for (const [index, record] of records.entries()) {
      try {
        logger.info(
          `🚀 Processing Deal at index: ${index + 1} of ${JSON.stringify(
            record,
            null,
            2
          )}`
        );
        return; // TODO Remove this return statement after testing
      } catch (error) {
        logger.error(`❌ Error processing Deal in Batch`, {
          status: error?.status,
          response: error.response?.data,
          method: error?.method,
          url: error?.config?.url,
          headers: error?.config?.headers,
          message: error.message,
        });
      }
    }
  } catch (error) {
    logger.error(`❌ Error processing Deal in Batch`, {
      status: error?.status,
      response: error.response?.data,
      method: error?.method,
      url: error?.config?.url,
      headers: error?.config?.headers,
      message: error.message,
    });
  }
}

export { syncHubspotDealToCentralReachClient };
