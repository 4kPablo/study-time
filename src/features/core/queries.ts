import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { newId, unifiedRepository } from "./unified-repository";
import type {
  Activity,
  CategoryId,
  Deadline,
  Resource,
  Session,
  Settings,
  StudyData,
} from "./types";

const dataKey = ["study-data"] as const;

export function useStudyData() {
  return useQuery({
    queryKey: dataKey,
    queryFn: () => unifiedRepository.load(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

function useDataMutation<TVars>(
  mutateFn: (vars: TVars) => Promise<unknown>,
  options?: {
    onMutate?: (
      vars: TVars,
      qc: ReturnType<typeof useQueryClient>,
    ) => Promise<StudyData | undefined>;
    onSuccess?: (data: unknown, vars: TVars) => void;
  },
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: mutateFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: dataKey });
      const previousData = qc.getQueryData<StudyData>(dataKey);
      if (options?.onMutate) {
        const optimisticData = await options.onMutate(vars, qc);
        if (optimisticData) qc.setQueryData(dataKey, optimisticData);
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) qc.setQueryData(dataKey, context.previousData);
    },
    onSuccess: (data, vars) => {
      options?.onSuccess?.(data, vars);
      qc.invalidateQueries({ queryKey: dataKey });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dataKey });
    },
  });
}

export const useAddActivity = () =>
  useDataMutation<{ name: string; categoryId: CategoryId }>(
    (vars) =>
      unifiedRepository.update((data) => ({
        ...data,
        activities: [
          ...data.activities,
          {
            id: newId(),
            name: vars.name.trim(),
            categoryId: vars.categoryId,
            favorite: false,
            countsTowardGoal: true,
            createdAt: new Date().toISOString(),
          },
        ],
      })),
    {
      onMutate: async (vars, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        const optimistic: Activity = {
          id: `temp-${Date.now()}`,
          name: vars.name.trim(),
          categoryId: vars.categoryId,
          favorite: false,
          countsTowardGoal: true,
          createdAt: new Date().toISOString(),
        };
        return { ...current, activities: [...current.activities, optimistic] };
      },
    },
  );

export const useUpdateActivity = () =>
  useDataMutation<{ id: string; patch: Partial<Activity> }>(
    ({ id, patch }) =>
      unifiedRepository.update((data) => ({
        ...data,
        activities: data.activities.map((activity) =>
          activity.id === id ? { ...activity, ...patch } : activity,
        ),
      })),
    {
      onMutate: async ({ id, patch }, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return {
          ...current,
          activities: current.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        };
      },
    },
  );

export const useDeleteActivity = () =>
  useDataMutation<string>(
    (id) =>
      unifiedRepository.update((data) => ({
        ...data,
        activities: data.activities.filter((activity) => activity.id !== id),
        resources: data.resources.filter((resource) => resource.activityId !== id),
        deadlines: data.deadlines.filter((deadline) => deadline.activityId !== id),
      })),
    {
      onMutate: async (id, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return {
          ...current,
          activities: current.activities.filter((a) => a.id !== id),
          resources: current.resources.filter((r) => r.activityId !== id),
          deadlines: current.deadlines.filter((d) => d.activityId !== id),
        };
      },
    },
  );

export const useRestoreActivity = () =>
  useDataMutation<{ activity: Activity; resources: Resource[]; deadlines: Deadline[] }>(
    ({ activity, resources, deadlines }) =>
      unifiedRepository.update((data) => {
        if (data.activities.some((item) => item.id === activity.id)) return data;
        return {
          ...data,
          activities: [...data.activities, activity],
          resources: [...data.resources, ...resources],
          deadlines: [...data.deadlines, ...deadlines],
        };
      }),
    {
      onMutate: async ({ activity, resources, deadlines }, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        if (current.activities.some((a) => a.id === activity.id)) return;
        return {
          ...current,
          activities: [...current.activities, activity],
          resources: [...current.resources, ...resources],
          deadlines: [...current.deadlines, ...deadlines],
        };
      },
    },
  );

export const useAddResource = () =>
  useDataMutation<Omit<Resource, "id">>(
    (vars) =>
      unifiedRepository.update((data) => ({
        ...data,
        resources: [...data.resources, { ...vars, id: newId() }],
      })),
    {
      onMutate: async (vars, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        const optimistic: Resource = { ...vars, id: `temp-${Date.now()}` };
        return { ...current, resources: [...current.resources, optimistic] };
      },
    },
  );

export const useUpdateResource = () =>
  useDataMutation<{ id: string; patch: Partial<Omit<Resource, "id">> }>(
    ({ id, patch }) =>
      unifiedRepository.update((data) => ({
        ...data,
        resources: data.resources.map((resource) =>
          resource.id === id ? { ...resource, ...patch } : resource,
        ),
      })),
    {
      onMutate: async ({ id, patch }, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return {
          ...current,
          resources: current.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        };
      },
    },
  );

export const useDeleteResource = () =>
  useDataMutation<string>(
    (id) =>
      unifiedRepository.update((data) => ({
        ...data,
        resources: data.resources.filter((resource) => resource.id !== id),
      })),
    {
      onMutate: async (id, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return { ...current, resources: current.resources.filter((r) => r.id !== id) };
      },
    },
  );

export const useAddDeadline = () =>
  useDataMutation<Omit<Deadline, "id">>(
    (vars) =>
      unifiedRepository.update((data) => ({
        ...data,
        deadlines: [...data.deadlines, { ...vars, id: newId() }],
      })),
    {
      onMutate: async (vars, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        const optimistic: Deadline = { ...vars, id: `temp-${Date.now()}` };
        return { ...current, deadlines: [...current.deadlines, optimistic] };
      },
    },
  );

export const useDeleteDeadline = () =>
  useDataMutation<string>(
    (id) =>
      unifiedRepository.update((data) => ({
        ...data,
        deadlines: data.deadlines.filter((deadline) => deadline.id !== id),
      })),
    {
      onMutate: async (id, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return { ...current, deadlines: current.deadlines.filter((d) => d.id !== id) };
      },
    },
  );

export const useAddSession = () =>
  useDataMutation<Omit<Session, "id">>(
    (vars) =>
      unifiedRepository.update((data) => ({
        ...data,
        sessions: [...data.sessions, { ...vars, id: newId() }],
      })),
    {
      onMutate: async (vars, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        const optimistic: Session = { ...vars, id: `temp-${Date.now()}` };
        return { ...current, sessions: [...current.sessions, optimistic] };
      },
    },
  );

export const useUpdateSession = () =>
  useDataMutation<{ id: string; patch: Partial<Session> }>(
    ({ id, patch }) =>
      unifiedRepository.update((data) => ({
        ...data,
        sessions: data.sessions.map((session) =>
          session.id === id ? { ...session, ...patch } : session,
        ),
      })),
    {
      onMutate: async ({ id, patch }, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return {
          ...current,
          sessions: current.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        };
      },
    },
  );

export const useDeleteSession = () =>
  useDataMutation<string>(
    (id) =>
      unifiedRepository.update((data) => ({
        ...data,
        sessions: data.sessions.filter((session) => session.id !== id),
      })),
    {
      onMutate: async (id, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return { ...current, sessions: current.sessions.filter((s) => s.id !== id) };
      },
    },
  );

export const useRestoreSession = () =>
  useDataMutation<Session>(
    (session) =>
      unifiedRepository.update((data) =>
        data.sessions.some((item) => item.id === session.id)
          ? data
          : { ...data, sessions: [...data.sessions, session] },
      ),
    {
      onMutate: async (session, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        if (current.sessions.some((s) => s.id === session.id)) return;
        return { ...current, sessions: [...current.sessions, session] };
      },
    },
  );

export const useUpdateSettings = () =>
  useDataMutation<Partial<Settings>>(
    (patch) =>
      unifiedRepository.update((data) => ({
        ...data,
        settings: { ...data.settings, ...patch },
      })),
    {
      onMutate: async (patch, qc) => {
        const current = qc.getQueryData<StudyData>(dataKey);
        if (!current) return;
        return { ...current, settings: { ...current.settings, ...patch } };
      },
    },
  );

export const useImportData = () =>
  useDataMutation<StudyData>((imported) => unifiedRepository.update(() => imported), {
    onMutate: async (imported) => imported,
  });
