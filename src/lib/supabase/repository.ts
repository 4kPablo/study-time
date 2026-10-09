import { createClient } from "@/lib/supabase/client";
import type {
  Activity,
  CategoryId,
  Deadline,
  Resource,
  Session,
  Settings,
  StudyData,
  SessionMode,
} from "@/features/core/types";
import type {
  ActivityRow,
  ActivityInsert,
  ActivityUpdate,
  SessionRow,
  SessionInsert,
  SessionUpdate,
  ResourceRow,
  ResourceInsert,
  ResourceUpdate,
  GeneralResourceRow,
  GeneralResourceInsert,
  GeneralResourceUpdate,
  DeadlineRow,
  DeadlineInsert,
  DeadlineUpdate,
  UserSettingsRow,
  UserSettingsInsert,
  UserSettingsUpdate,
} from "@/lib/supabase/types";

let client: ReturnType<typeof createClient> | undefined;
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, property) {
    client ??= createClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    favorite: row.favorite,
    countsTowardGoal: row.counts_toward_goal,
    createdAt: row.created_at,
  };
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    activityId: row.activity_id,
    categoryId: row.category_id,
    date: row.date,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMin: row.duration_min,
    mode: row.mode,
    energy: row.energy,
    outcome: row.outcome,
    distractions: row.distractions,
    notes: row.notes ?? "",
    nextStep: row.next_step ?? "",
  };
}

function toResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    activityId: row.activity_id,
    label: row.label,
    url: row.url,
    kind: row.kind,
  };
}

function toGeneralResource(row: GeneralResourceRow): Resource {
  return {
    id: row.id,
    activityId: "",
    label: row.label,
    url: row.url,
    kind: row.kind,
  };
}

function toDeadline(row: DeadlineRow): Deadline {
  return {
    id: row.id,
    activityId: row.activity_id,
    kind: row.kind,
    title: row.title,
    date: row.date,
  };
}

function toSettings(row: UserSettingsRow): Settings {
  return {
    weeklyGoalMin: row.weekly_goal_min,
  };
}

export const supabaseRepository = {
  async load(): Promise<StudyData> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const [
      { data: activities, error: activitiesError },
      { data: sessions, error: sessionsError },
      { data: resources, error: resourcesError },
      { data: generalResources, error: generalResourcesError },
      { data: deadlines, error: deadlinesError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      supabase.from("activities").select("*").eq("user_id", user.id),
      supabase.from("sessions").select("*").eq("user_id", user.id),
      supabase.from("resources").select("*").eq("user_id", user.id),
      supabase.from("general_resources").select("*").eq("user_id", user.id),
      supabase.from("deadlines").select("*").eq("user_id", user.id),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (activitiesError) throw activitiesError;
    if (sessionsError) throw sessionsError;
    if (resourcesError) throw resourcesError;
    if (generalResourcesError) throw generalResourcesError;
    if (deadlinesError) throw deadlinesError;
    if (settingsError) throw settingsError;

    return {
      activities: (activities ?? []).map(toActivity),
      sessions: (sessions ?? []).map(toSession),
      resources: (resources ?? []).map(toResource),
      generalResources: (generalResources ?? []).map(toGeneralResource),
      deadlines: (deadlines ?? []).map(toDeadline),
      settings: settings ? toSettings(settings) : { weeklyGoalMin: 600 },
    };
  },

  async ensureSettings(): Promise<UserSettingsRow> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, weekly_goal_min: 600 }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const update: UserSettingsUpdate = {};
    if (patch.weeklyGoalMin !== undefined) update.weekly_goal_min = patch.weeklyGoalMin;

    const { data, error } = await supabase
      .from("user_settings")
      .update(update)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return toSettings(data);
  },

  async addActivity(input: { name: string; categoryId: CategoryId }): Promise<Activity> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insert: ActivityInsert = {
      user_id: user.id,
      category_id: input.categoryId,
      name: input.name.trim(),
      favorite: false,
      counts_toward_goal: true,
    };

    const { data, error } = await supabase.from("activities").insert(insert).select().single();

    if (error) throw error;
    return toActivity(data);
  },

  async updateActivity(id: string, patch: Partial<Activity>): Promise<Activity> {
    const update: ActivityUpdate = {};
    if (patch.name !== undefined) update.name = patch.name.trim();
    if (patch.favorite !== undefined) update.favorite = patch.favorite;
    if (patch.countsTowardGoal !== undefined) update.counts_toward_goal = patch.countsTowardGoal;
    if (patch.categoryId !== undefined) update.category_id = patch.categoryId;

    const { data, error } = await supabase
      .from("activities")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toActivity(data);
  },

  async deleteActivity(id: string): Promise<void> {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw error;
  },

  async addResource(input: Omit<Resource, "id">): Promise<Resource> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insert: ResourceInsert = {
      user_id: user.id,
      activity_id: input.activityId,
      label: input.label,
      url: input.url,
      kind: input.kind,
    };

    const { data, error } = await supabase.from("resources").insert(insert).select().single();

    if (error) throw error;
    return toResource(data);
  },

  async updateResource(id: string, patch: Partial<Omit<Resource, "id">>): Promise<Resource> {
    const update: ResourceUpdate = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.url !== undefined) update.url = patch.url;
    if (patch.kind !== undefined) update.kind = patch.kind;
    if (patch.activityId !== undefined) update.activity_id = patch.activityId;

    const { data, error } = await supabase
      .from("resources")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toResource(data);
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) throw error;
  },

  async addGeneralResource(input: Omit<Resource, "id" | "activityId">): Promise<Resource> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insert: GeneralResourceInsert = {
      user_id: user.id,
      label: input.label,
      url: input.url,
      kind: input.kind,
    };

    const { data, error } = await supabase
      .from("general_resources")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return toGeneralResource(data);
  },

  async deleteGeneralResource(id: string): Promise<void> {
    const { error } = await supabase.from("general_resources").delete().eq("id", id);
    if (error) throw error;
  },

  async addDeadline(input: Omit<Deadline, "id">): Promise<Deadline> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insert: DeadlineInsert = {
      user_id: user.id,
      activity_id: input.activityId,
      kind: input.kind,
      title: input.title,
      date: input.date,
    };

    const { data, error } = await supabase.from("deadlines").insert(insert).select().single();

    if (error) throw error;
    return toDeadline(data);
  },

  async deleteDeadline(id: string): Promise<void> {
    const { error } = await supabase.from("deadlines").delete().eq("id", id);
    if (error) throw error;
  },

  async addSession(input: Omit<Session, "id">): Promise<Session> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insert: SessionInsert = {
      user_id: user.id,
      activity_id: input.activityId,
      category_id: input.categoryId,
      date: input.date,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_min: input.durationMin,
      mode: input.mode,
      energy: input.energy,
      outcome: input.outcome,
      distractions: input.distractions,
      notes: input.notes || null,
      next_step: input.nextStep || null,
    };

    const { data, error } = await supabase.from("sessions").insert(insert).select().single();

    if (error) throw error;
    return toSession(data);
  },

  async updateSession(id: string, patch: Partial<Session>): Promise<Session> {
    const update: SessionUpdate = {};
    if (patch.activityId !== undefined) update.activity_id = patch.activityId;
    if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
    if (patch.date !== undefined) update.date = patch.date;
    if (patch.startedAt !== undefined) update.started_at = patch.startedAt;
    if (patch.endedAt !== undefined) update.ended_at = patch.endedAt;
    if (patch.durationMin !== undefined) update.duration_min = patch.durationMin;
    if (patch.mode !== undefined) update.mode = patch.mode;
    if (patch.energy !== undefined) update.energy = patch.energy;
    if (patch.outcome !== undefined) update.outcome = patch.outcome;
    if (patch.distractions !== undefined) update.distractions = patch.distractions;
    if (patch.notes !== undefined) update.notes = patch.notes || null;
    if (patch.nextStep !== undefined) update.next_step = patch.nextStep || null;

    const { data, error } = await supabase
      .from("sessions")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toSession(data);
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) throw error;
  },

  async importData(data: StudyData): Promise<StudyData> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase.from("sessions").delete().eq("user_id", user.id);
    await supabase.from("deadlines").delete().eq("user_id", user.id);
    await supabase.from("resources").delete().eq("user_id", user.id);
    await supabase.from("general_resources").delete().eq("user_id", user.id);
    await supabase.from("activities").delete().eq("user_id", user.id);

    if (data.activities.length > 0) {
      const activitiesInsert = data.activities.map((a) => ({
        user_id: user.id,
        id: a.id,
        category_id: a.categoryId,
        name: a.name,
        favorite: a.favorite,
        counts_toward_goal: a.countsTowardGoal,
        created_at: a.createdAt,
      }));
      const { error } = await supabase.from("activities").insert(activitiesInsert);
      if (error) throw error;
    }

    if (data.sessions.length > 0) {
      const sessionsInsert = data.sessions.map((s) => ({
        user_id: user.id,
        id: s.id,
        activity_id: s.activityId,
        category_id: s.categoryId,
        date: s.date,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        duration_min: s.durationMin,
        mode: s.mode,
        energy: s.energy,
        outcome: s.outcome,
        distractions: s.distractions,
        notes: s.notes || null,
        next_step: s.nextStep || null,
      }));
      const { error } = await supabase.from("sessions").insert(sessionsInsert);
      if (error) throw error;
    }

    if (data.resources.length > 0) {
      const resourcesInsert = data.resources.map((r) => ({
        user_id: user.id,
        id: r.id,
        activity_id: r.activityId,
        label: r.label,
        url: r.url,
        kind: r.kind,
      }));
      const { error } = await supabase.from("resources").insert(resourcesInsert);
      if (error) throw error;
    }

    if (data.generalResources.length > 0) {
      const generalResourcesInsert = data.generalResources.map((r) => ({
        user_id: user.id,
        id: r.id,
        label: r.label,
        url: r.url,
        kind: r.kind,
      }));
      const { error } = await supabase.from("general_resources").insert(generalResourcesInsert);
      if (error) throw error;
    }

    if (data.deadlines.length > 0) {
      const deadlinesInsert = data.deadlines.map((d) => ({
        user_id: user.id,
        id: d.id,
        activity_id: d.activityId,
        kind: d.kind,
        title: d.title,
        date: d.date,
      }));
      const { error } = await supabase.from("deadlines").insert(deadlinesInsert);
      if (error) throw error;
    }

    await this.updateSettings(data.settings);

    return data;
  },
};
