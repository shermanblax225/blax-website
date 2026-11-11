CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  UNIQUE (display_name, rating, comment)
);
