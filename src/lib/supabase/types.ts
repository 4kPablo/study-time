import type { Database } from "./database.types";

export type Tables = Database["public"]["Tables"];

export type ActivityRow = Tables["activities"]["Row"];
export type ActivityInsert = Tables["activities"]["Insert"];
export type ActivityUpdate = Tables["activities"]["Update"];

export type SessionRow = Tables["sessions"]["Row"];
export type SessionInsert = Tables["sessions"]["Insert"];
export type SessionUpdate = Tables["sessions"]["Update"];

export type ResourceRow = Tables["resources"]["Row"];
export type ResourceInsert = Tables["resources"]["Insert"];
export type ResourceUpdate = Tables["resources"]["Update"];

export type GeneralResourceRow = Tables["general_resources"]["Row"];
export type GeneralResourceInsert = Tables["general_resources"]["Insert"];
export type GeneralResourceUpdate = Tables["general_resources"]["Update"];

export type DeadlineRow = Tables["deadlines"]["Row"];
export type DeadlineInsert = Tables["deadlines"]["Insert"];
export type DeadlineUpdate = Tables["deadlines"]["Update"];

export type UserSettingsRow = Tables["user_settings"]["Row"];
export type UserSettingsInsert = Tables["user_settings"]["Insert"];
export type UserSettingsUpdate = Tables["user_settings"]["Update"];

export type CategoryRow = Tables["categories"]["Row"];
