CREATE TABLE `gcal_accounts` (
	`sub` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL,
	`channel_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`channel_expiration` integer,
	`calendar_list` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gcal_event_channels` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`channel_expiration` integer,
	`calendar_id` text NOT NULL,
	`sync_token` text NOT NULL,
	`gcal_account_id` text NOT NULL,
	FOREIGN KEY (`gcal_account_id`) REFERENCES `gcal_accounts`(`sub`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `oauth_accounts` (
	`provider_id` text,
	`provider_user_id` text,
	`userId` text NOT NULL,
	PRIMARY KEY(`provider_id`, `provider_user_id`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_accounts_access_token_unique` ON `gcal_accounts` (`access_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_accounts_refresh_token_unique` ON `gcal_accounts` (`refresh_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_accounts_channel_id_unique` ON `gcal_accounts` (`channel_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_accounts_resource_id_unique` ON `gcal_accounts` (`resource_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_event_channels_resource_id_unique` ON `gcal_event_channels` (`resource_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gcal_event_channels_calendar_id_unique` ON `gcal_event_channels` (`calendar_id`);