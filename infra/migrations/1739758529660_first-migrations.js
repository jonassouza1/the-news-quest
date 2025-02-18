/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    email: { type: "text", notNull: true, unique: true },
    created_at: { type: "timestamp", default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("newsletters", {
    id: "id",
    edition_id: { type: "text", notNull: true, unique: true },
    title: { type: "text", notNull: false },
    content: { type: "text", notNull: false },
    published_at: { type: "timestamp", notNull: false },
    author: { type: "text", notNull: false },
    created_at: { type: "timestamp", default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("reads", {
    id: "id",
    user_id: {
      type: "integer",
      references: "users",
      notNull: true,
      onDelete: "CASCADE",
    },
    newsletter_id: {
      type: "integer",
      references: "newsletters",
      notNull: true,
      onDelete: "CASCADE",
    },
    read_at: { type: "timestamp", default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("streaks", {
    id: "id",
    user_id: {
      type: "integer",
      references: "users",
      notNull: true,
      onDelete: "CASCADE",
    },
    streak_count: { type: "integer", notNull: true, default: 0 },
    last_read_at: { type: "timestamp", default: pgm.func("CURRENT_TIMESTAMP") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("streaks");
  pgm.dropTable("reads");
  pgm.dropTable("newsletters");
  pgm.dropTable("users");
};
