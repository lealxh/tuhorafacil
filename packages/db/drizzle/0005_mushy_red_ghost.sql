ALTER TABLE `estilistas` ADD `foto_url` text;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'estilista' NOT NULL;