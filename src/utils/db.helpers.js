import { pool } from "../config/db.js";
import { AppError } from "./app-error.js";

const tableColumnsCache = new Map();

const getTableColumns = async (tableName) => {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }

  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );

  const columns = result.rows.map((row) => row.column_name);
  tableColumnsCache.set(tableName, columns);
  return columns;
};

export const getColumns = getTableColumns;

export const buildColumnSelect = (tableAlias, columns, candidates, outputName) => {
  const column = candidates.find((candidate) => columns.includes(candidate));
  return column ? `${tableAlias}.${column} AS ${outputName}` : `NULL AS ${outputName}`;
};

export const buildCoalesceSelect = (tableAlias, columns, candidates, outputName) => {
  const existingColumns = candidates.filter((candidate) => columns.includes(candidate));

  if (existingColumns.length === 0) {
    return `NULL AS ${outputName}`;
  }

  if (existingColumns.length === 1) {
    return `${tableAlias}.${existingColumns[0]} AS ${outputName}`;
  }

  return `COALESCE(${existingColumns.map((column) => `${tableAlias}.${column}`).join(", ")}) AS ${outputName}`;
};

export const requireFields = (payload, fields) => {
  const missingFields = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new AppError(`Missing required field(s): ${missingFields.join(", ")}`, 400);
  }
};

export const requireOneOf = (payload, fields, label) => {
  const hasValue = fields.some((field) => {
    const value = payload[field];
    return value !== undefined && value !== null && value !== "";
  });

  if (!hasValue) {
    throw new AppError(`Missing required field: ${label}`, 400);
  }
};

export const assertAllowedRole = (role, expectedRole) => {
  if (role !== expectedRole) {
    throw new AppError(`User role must be '${expectedRole}'`, 400);
  }
};

export const findById = async (tableName, id) => {
  const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const assertExists = async (tableName, id, label) => {
  const row = await findById(tableName, id);

  if (!row) {
    throw new AppError(`${label} not found`, 404);
  }

  return row;
};

export const assertNoProfileForUser = async (tableName, userId, label) => {
  const result = await pool.query(`SELECT id FROM ${tableName} WHERE user_id = $1 LIMIT 1`, [userId]);

  if (result.rows.length > 0) {
    throw new AppError(`User already has a ${label} profile`, 409);
  }
};

export const pickFields = async (tableName, payload, allowedFields) => {
  const tableColumns = await getTableColumns(tableName);

  return allowedFields.reduce((picked, field) => {
    if (tableColumns.includes(field) && payload[field] !== undefined) {
      picked[field] = payload[field];
    }

    return picked;
  }, {});
};

export const insertRow = async (tableName, data) => {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new AppError("No valid fields provided", 400);
  }

  const columns = keys.join(", ");
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const values = keys.map((key) => data[key]);

  const result = await pool.query(
    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return result.rows[0];
};

export const updateRow = async (tableName, id, data) => {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new AppError("No valid fields provided", 400);
  }

  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const values = [...keys.map((key) => data[key]), id];

  const result = await pool.query(
    `UPDATE ${tableName} SET ${assignments} WHERE id = $${keys.length + 1} RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new AppError("Record not found", 404);
  }

  return result.rows[0];
};
