-- A second forex feed to point an instrument at.
--
-- Adding a value to a MySQL enum rewrites the column definition and nothing
-- else: every existing row keeps the source it had, and SIMULATED stays the
-- default.
ALTER TABLE `assets` MODIFY `source` ENUM('BINANCE', 'FASTFOREX', 'TWELVEDATA', 'SIMULATED') NOT NULL DEFAULT 'SIMULATED';
