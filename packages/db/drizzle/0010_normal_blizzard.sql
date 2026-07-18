ALTER TABLE `estilistas` ADD `kapso_customer_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `estilistas_kapso_customer_id_unique` ON `estilistas` (`kapso_customer_id`);