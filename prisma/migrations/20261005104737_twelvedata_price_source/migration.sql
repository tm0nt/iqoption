-- A forex feed to point an instrument at.
--
-- Adding a value to a MySQL enum rewrites the column definition and nothing
-- else: every existing row keeps the source it had, and SIMULATED stays the
-- default, so an instrument becomes a Twelve Data one only when somebody says
-- so on the Instruments screen.
ALTER TABLE `assets` MODIFY `source` ENUM('BINANCE', 'TWELVEDATA', 'SIMULATED') NOT NULL DEFAULT 'SIMULATED';
