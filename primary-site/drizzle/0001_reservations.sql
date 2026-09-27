CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  seat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_email_sent_at TIMESTAMPTZ,
  confirmation_email_sending_at TIMESTAMPTZ,
  confirmation_email_error TEXT,
  seat_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  seat_email_sent_at TIMESTAMPTZ,
  seat_email_sending_at TIMESTAMPTZ,
  seat_email_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_email_lower ON reservations (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_seat_number ON reservations (seat_number) WHERE seat_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_seat_email ON reservations (status, seat_email_sent);