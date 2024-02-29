import { z } from "zod";

export const minAccessRoleSchema = z.enum(["freeBusyReader", "reader", "writer", "owner"]);
export type MinAccessRole = z.infer<typeof minAccessRoleSchema>;

export const calendarSchema = z.object({
  kind: z.literal("calendar#calendarListEntry"),
  etag: z.string(),
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
  summaryOverride: z.string().optional(),
  colorId: z.string().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  hidden: z.boolean().optional(),
  selected: z.boolean(),
  accessRole: minAccessRoleSchema,
  defaultReminders: z.array(
    z.object({
      method: z.enum(["email", "popup"]),
      minutes: z.number(),
    }),
  ),
  notificationSettings: z
    .object({
      notifications: z.array(
        z.object({
          method: z.enum(["email"]),
          type: z.enum([
            "eventCreation",
            "eventChange",
            "eventCancellation",
            "eventResponse",
            "agenda",
          ]),
        }),
      ),
    })
    .optional(),
  primary: z.boolean().optional(),
  deleted: z.boolean().optional(),
  conferenceProperties: z.object({
    allowedConferenceSolutionTypes: z.array(z.string()),
  }),
});

export const calendarListSchema = z.object({
  kind: z.literal("calendar#calendarList"),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(calendarSchema),
});
