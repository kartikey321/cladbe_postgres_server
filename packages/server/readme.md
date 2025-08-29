# Cladbe Postgres Server

A lightweight HTTP layer over `@cladbe/postgres_manager` providing CRUD-ish data access, schema creation and aggregations.

## Overview

- **Framework**: Hono
- **Default port**: 3000 (override with `PORT` environment variable)
- **Health check**: `GET /health`

## Environment Configuration

### PostgreSQL Connection

The server depends on PostgreSQL connection environment variables consumed by `@cladbe/postgres_manager`:

```bash
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=postgres
PGPORT=5432
```

```

### Server Configuration

```bash
PORT=3000
NODE_ENV=production|development
```

## Error Format

All routes return JSON errors in the following format:

```json
{
  "error": "Failed to retrieve data",
  "message": "Detailed error message",
  "stack": "stack only in development"
}
```

## API Routes

### Basic Routes

#### `GET /`
Basic ping endpoint.
- **Response**: `text/plain` → `Hello, Hono with TypeScript and PM2!`

#### `GET /api`
API status endpoint.
- **Response**:
```json
{ "message": "Scalable Hono API" }
```

#### `GET /health`
Health check endpoint.
- **Response**:
```json
{ "status": "ok" }
```

## Data APIs

All POST routes expect `Content-Type: application/json` and respond with:
```json
{ "data": "<payload-specific>" }
```

### 1. Fetch Data Collection — Keyset Pagination Supported

**`POST /get-data`**

Fetch a collection of rows with optional filters and ordering.
This endpoint now supports keyset pagination via `orderKeys` + `cursor` (+ `strictAfter`).

**Request Body** (`GetDataDbRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme",

  // optional: filter tree (AND/OR + leaves)
  "filters": [
    {
      "fieldName": "status",
      "value": "open",
      "filterType": "equals",
      "modifier": { 
        "distinct": false, 
        "caseInSensitive": false, 
        "nullsOrder": "default" 
      }
    }
  ],

  // EITHER keyset or offset pagination
  // --- KEYSET (preferred) ---
  "orderKeys": [
    { "field": "created_at", "sort": "DESC_DEFAULT" },
    { "field": "id", "sort": "DESC_DEFAULT" }                 // PK should be final tie-breaker
  ],
  "cursor": {
    "created_at": "2025-08-26T10:00:00.000Z",
    "id": "f1f9b662-86b7-4e65-9e54-0f0a33b6b8a0"
  },
  "strictAfter": true,     // default true; use strict "<" or ">" on boundary key

  // --- LIMIT ---
  "limit": 50

  // --- OFFSET (legacy; not with cursor) ---
  // "offset": 0
}
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "status": "open",
      "amount": 120.5
    }
  ]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/get-data \
  -H 'Content-Type: application/json' \
  -d '{
    "tableName":"orders",
    "companyId":"acme",
    "filters":[{
      "fieldName":"status",
      "value":"open",
      "filterType":"equals",
      "modifier":{"caseInSensitive":false,"nullsOrder":"default"}
    }],
    "limit":25,
    "orderKeys":[{"field":"created_at","sort":"DESC_DEFAULT"}]
  }'
```

### 2. Fetch Single Record

**`POST /get-single-record`**

Fetch one row by primary key.

**Request Body** (`GetSingleRecordRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme",
  "primaryKeyColumn": "id",
  "primaryId": "12345"
}
```

**Response**:
```json
{
  "data": {
    "id": "12345",
    "status": "open"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/get-single-record \
  -H 'Content-Type: application/json' \
  -d '{"tableName":"orders","companyId":"acme","primaryKeyColumn":"id","primaryId":"12345"}'
```

### 3. Add Single Record

**`POST /add-single-record`**

Insert one row.

**Request Body** (`AddSingleDbRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme",
  "primaryKeyColumn": "id",
  "data": {
    "id": "12345",
    "status": "open",
    "amount": 120.5,
    "meta": { "source": "web" }
  }
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "12345",
      "status": "open",
      "amount": 120.5,
      "meta": {"source": "web"}
    }
  ]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/add-single-record \
  -H 'Content-Type: application/json' \
  -d '{"tableName":"orders","companyId":"acme","primaryKeyColumn":"id","data":{"id":"12345","status":"open","amount":120.5}}'
```

### 4. Update Single Record

**`POST /update-single-record`**

Update one row by primary key.

**Request Body** (`UpdateSingleDbRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme",
  "primaryKeyColumn": "id",
  "primaryId": "12345",
  "updates": {
    "status": "closed",
    "closed_at": "2025-08-26T10:00:00Z"
  }
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "12345",
      "status": "closed",
      "closed_at": "2025-08-26T10:00:00.000Z"
    }
  ]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/update-single-record \
  -H 'Content-Type: application/json' \
  -d '{"tableName":"orders","companyId":"acme","primaryKeyColumn":"id","primaryId":"12345","updates":{"status":"closed"}}'
```

### 5. Check Table Existence

**`POST /table-exists`**

Check if a namespaced table exists (`<companyId>_<tableName>`).

**Request Body** (`TableExistsRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme"
}
```

**Response**:
```json
{
  "data": true
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/table-exists \
  -H 'Content-Type: application/json' \
  -d '{"tableName":"orders","companyId":"acme"}'
```

### 6. Create Table

**`POST /create-table`**

Create a table using a TableDefinition. The server automatically prefixes with `companyId_`.

**Request Body** (`CreateTableDbRequest`):
```json
{
  "companyId": "acme",
  "definition": {
    "name": "orders",
    "columns": [
      {
        "name": "id",
        "dataType": "uuid",
        "isNullable": false,
        "constraints": ["primaryKey"]
      },
      {
        "name": "status",
        "dataType": "varchar",
        "isNullable": false,
        "constraints": ["indexed"],
        "customOptions": { "length": 64 }
      },
      {
        "name": "amount",
        "dataType": "numeric",
        "isNullable": true,
        "constraints": []
      },
      {
        "name": "meta",
        "dataType": "jsonb",
        "isNullable": true,
        "constraints": []
      },
      {
        "name": "created_at",
        "dataType": "timestamptz",
        "isNullable": false,
        "constraints": ["default_"],
        "customOptions": { "defaultValue": "CURRENT_TIMESTAMP" }
      }
    ],
    "comment": "Orders table",
    "tableOptions": {}
  }
}
```

**Response**:
```json
{
  "data": true
}
```

### 7. Run Aggregation

**`POST /run-aggregation`**

Run sum/avg/min/max/count operations with optional filters.

**Request Body** (`AggregationRequest`):
```json
{
  "tableName": "orders",
  "companyId": "acme",
  "sumFields": ["amount"],
  "averageFields": ["amount"],
  "minimumFields": ["amount"],
  "maximumFields": ["amount"],
  "countEnabled": true,
  "filters": [
    {
      "fieldName": "status",
      "value": "closed",
      "filterType": "equals",
      "modifier": {
        "caseInSensitive": false,
        "nullsOrder": "default"
      }
    }
  ]
}
```

**Response**:
```json
{
  "data": {
    "count": 123,
    "sumValues": { "amount": 10234.5 },
    "avgValues": { "amount": 83.22 },
    "minimumValues": { "amount": 1.5 },
    "maximumValues": { "amount": 1200.0 }
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/run-aggregation \
  -H 'Content-Type: application/json' \
  -d '{"tableName":"orders","companyId":"acme","sumFields":["amount"],"countEnabled":true}'
```

## Filtering Guide

### Single Filter Structure
```json
{
  "fieldName": "status",
  "value": "open",
  "filterType": "equals",
  "modifier": {
    "distinct": false,
    "caseInSensitive": false,
    "nullsOrder": "default"
  }
}
```

### Filter Wrapper (Combining Filters)
```json
{
  "filterWrapperType": "and",
  "filters": [
    {
      "fieldName": "amount",
      "value": [100, 500],
      "filterType": "between",
      "modifier": {
        "caseInSensitive": false,
        "nullsOrder": "default"
      }
    },
    {
      "fieldName": "status",
      "value": ["open", "review"],
      "filterType": "in",
      "modifier": {
        "caseInSensitive": false,
        "nullsOrder": "default"
      }
    }
  ]
}
```

### Supported Filter Types
- `equals` | `notEquals`
- `isNull` | `isNotNull`
- `startsWith` | `endsWith` | `contains`
- `between` | `notBetween`
- `in` | `notIn`
- `regex` | `notRegex`

### Sorting Options

When using the `orderKeys` array (preferred method):

```json
"orderKeys": [
  { "field": "created_at", "sort": "DESC_DEFAULT" },
  { "field": "amount", "sort": "ASC_NULLS_LAST" }
]
```

**Available sort options:**
- `ASC_DEFAULT` | `ASC_NULLS_FIRST` | `ASC_NULLS_LAST`
- `DESC_DEFAULT` | `DESC_NULLS_FIRST` | `DESC_NULLS_LAST`

## Keyset Pagination & Sorting Recap

- **Prefer** `orderKeys` over legacy `dataSort`
- **Ensure** the last `orderKeys` entry is your PK (ASC/DESC consistent with your query)
- **With keyset pagination**, pass a `cursor` (some or all order keys) and optional `strictAfter` (default true)

## Data Types

Supported column data types include:
- `text` | `varchar` | `char`
- `integer` | `numeric`
- `jsonb`
- `timestamptz`
- `uuid`

## Important Notes

### Namespacing
- Tables are referenced internally as `${companyId}_${tableName}`
- Example: `"acme"` + `"orders"` = `acme_orders` table

### JSON Data
- Objects and arrays in `AddSingleDbRequest.data` are automatically cast to `jsonb`

### Security
- Column names are validated with a strict whitelist (`[a-zA-Z0-9_.]+`) before interpolation

### Sorting Options
- **Legacy**: Use `dataSort` for single-key sorting
- **Preferred**: Use `orderKeys` array for multi-key sorting with explicit nulls ordering

## Getting Started

1. Set up your PostgreSQL connection environment variables
2. Start the server (default port 3000)
3. Check health with `GET /health`
4. Use the POST endpoints for data operations

The server provides a complete CRUD interface with advanced filtering, sorting, and aggregation capabilities for PostgreSQL databases.