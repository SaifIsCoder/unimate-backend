/**
 * Soft Delete Utility
 * 
 * WHY: Academic data must never be hard deleted.
 * Soft delete preserves data integrity and audit trails.
 */

/**
 * Add soft delete plugin to schema
 * Adds deletedAt field and methods: softDelete(), restore(), findWithDeleted()
 */
const addSoftDelete = (schema) => {
  // Add deletedAt field
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  });

  // Soft delete method
  schema.methods.softDelete = async function() {
    this.deletedAt = new Date();
    return this.save();
  };

  // Restore method
  schema.methods.restore = async function() {
    this.deletedAt = null;
    return this.save();
  };

  // Query helper: exclude deleted by default
  schema.query.notDeleted = function() {
    return this.where({ deletedAt: null });
  };

  // Query helper: include deleted
  schema.query.withDeleted = function() {
    return this;
  };

  // Query helper: only deleted
  schema.query.onlyDeleted = function() {
    return this.where({ deletedAt: { $ne: null } });
  };

  // Modify find queries to exclude deleted by default
  schema.pre(/^find/, function() {
    if (!this.getOptions().includeDeleted) {
      this.where({ deletedAt: null });
    }
  });
};

module.exports = { addSoftDelete };
