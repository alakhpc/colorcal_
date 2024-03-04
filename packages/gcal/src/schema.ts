import { z } from "zod";

export const minAccessRoleSchema = z.enum(["freeBusyReader", "reader", "writer", "owner"]);
export type MinAccessRole = z.infer<typeof minAccessRoleSchema>;
export const eventTypeSchema = z.enum(["default", "focusTime", "outOfOffice", "workingLocation"]);
export type EventType = z.infer<typeof eventTypeSchema>;

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
  selected: z.boolean().optional(),
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
export type GcalCalendar = z.infer<typeof calendarSchema>;

export const calendarListSchema = z.object({
  kind: z.literal("calendar#calendarList"),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(calendarSchema),
});
export type GcalCalendarList = z.infer<typeof calendarListSchema>;

const eventSchema = z.object({
  id: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]),
  eventType: eventTypeSchema.optional(),
});
export type GcalEvent = z.infer<typeof eventSchema>;

export const eventListSchema = z.object({
  kind: z.literal("calendar#events"),
  etag: z.string(),
  summary: z.string(),
  description: z.string(),
  updated: z.string(),
  timeZone: z.string(),
  accessRole: minAccessRoleSchema,
  defaultReminders: z.array(
    z.object({
      method: z.enum(["email", "popup"]),
      minutes: z.number(),
    }),
  ),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(eventSchema),
});
export type GcalEventList = z.infer<typeof eventListSchema>;
