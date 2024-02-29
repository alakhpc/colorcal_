CREATE TABLE `google_calendar_accounts` (
	`sub` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `google_calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`watch_channel_id` text NOT NULL,
	`watch_resource_id` text NOT NULL,
	`watch_expiration` integer NOT NULL,
	`google_account_id` text NOT NULL,
	FOREIGN KEY (`google_account_id`) REFERENCES `google_calendar_accounts`(`sub`) ON UPDATE no action ON DELETE cascade
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
CREATE UNIQUE INDEX `google_calendar_accounts_access_token_unique` ON `google_calendar_accounts` (`access_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `google_calendar_accounts_refresh_token_unique` ON `google_calendar_accounts` (`refresh_token`);