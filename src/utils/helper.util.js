import { logger } from "../index.js";

function contactProperties() {
  return [
    "email",
    "firstname",
    "lastname",
    "sourceid",
    "city",
    "state",
    "zip",
    "country",
    "address",
  ];
}
function dealProperties() {
  return ["dealname", "dealstage", "pipeline", "amount"];
}

export { contactProperties, dealProperties };
