export const buildInsert = (tableName, data) => {
  const keys = Object.keys(data);
  const columns = keys.join(", ");
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const values = keys.map((key) => data[key]);

  return {
    text: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  };
};

export const buildUpdate = (tableName, id, data, options = {}) => {
  const keys = Object.keys(data);
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const touchUpdatedAt = options.touchUpdatedAt ? ", updated_at = NOW()" : "";
  const values = [...keys.map((key) => data[key]), id];

  return {
    text: `UPDATE ${tableName} SET ${assignments}${touchUpdatedAt} WHERE id = $${keys.length + 1} RETURNING *`,
    values,
  };
};

export const omitUndefined = (payload) =>
  Object.entries(payload).reduce((data, [key, value]) => {
    if (value !== undefined) {
      data[key] = value;
    }

    return data;
  }, {});
