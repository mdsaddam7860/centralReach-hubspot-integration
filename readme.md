# HubSpot ↔ CentralReach Integration

## Overview

This integration enables bi-directional data synchronization between **HubSpot Deals** and **CentralReach Contacts**.

It consists of two primary workflows:

1. **HubSpot → CentralReach**  
   Sync deal-related child information from HubSpot to CentralReach Contacts.

2. **CentralReach → HubSpot**  
   Sync client status (Active/Inactive) from CentralReach back to HubSpot as a Deal Stage.

---

# Architecture Overview


- HubSpot is the source of truth for child-related intake data.
- CentralReach is the source of truth for client operational status.
- Status updates flow back to HubSpot.

---

# Workflow 1: Sync HubSpot Deal → CentralReach Contact

## Trigger

- Deal created or updated in HubSpot.
- Required child fields present.

## Data Flow

HubSpot Deal → Extract required properties → Transform → Create/Update CentralReach Contact.

## Fields Synced

The following HubSpot Deal fields are synced to CentralReach:

| HubSpot Deal Field | CentralReach Contact Field |
|--------------------|---------------------------|
| Child Name         | Contact Name              |
| Phone Number       | Phone                     |
| Email              | Email                     |
| Date of Birth      | DOB                       |
| Location           | Location                  |
| Child Gender       | Gender                    |
| Insurance Details  | Insurance Information     |

## Logic

- If a matching contact exists in CentralReach → Update contact.
- If no match exists → Create new contact.
- Matching logic typically based on:
  - Email (primary key)
  - Or Phone number fallback

## Validation Rules

- Email must be valid format.
- Date of Birth must follow ISO format (`YYYY-MM-DD`).
- Required fields must not be empty before sync.

---

# Workflow 2: Sync CentralReach Status → HubSpot Deal

## Trigger

- Contact status changes in CentralReach.
- Or scheduled polling mechanism.

## Data Flow

CentralReach Contact Status → Transform → Update HubSpot Deal Stage.

## Fields Synced Back

| CentralReach Field | HubSpot Field |
|--------------------|---------------|
| Status (Active / Inactive) | Deal Stage |

## Mapping Logic

| CentralReach Status | HubSpot Deal Stage |
|---------------------|--------------------|
| Active              | Active             |
| Inactive            | Inactive           |

- Only status field is synced back.
- No other contact data is updated in HubSpot.

---

# Error Handling

- API failures logged with full request/response payload.
- Retry mechanism for transient errors (e.g., 429, 5xx).
- Validation errors logged separately.
- Sync failures should not block other records.

---

# Security

- OAuth or API key authentication for both systems.
- Tokens stored securely via environment variables.
- No sensitive data stored in logs.

---

# Environment Variables
HUBSPOT_API_KEY=
HUBSPOT_ACCESS_TOKEN=
CENTRALREACH_API_KEY=
CENTRALREACH_BASE_URL=
---

# Deployment

1. Clone repository
2. Install dependencies and Start service
   ```bash
   npm install

   npm start
   ```
   
### Future Enhancements

- Webhook-based real-time sync (instead of polling).

- Improved duplicate detection logic.

- Audit log dashboard.

- Partial update detection to reduce API calls.

### Maintainer

###### Integration Owner: Mohammad Saddam
###### Project: HubSpot ↔ CentralReach Sync