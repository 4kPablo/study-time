import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { newId, repository } from "./repository";
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
    queryFn: () => repository.load(),
    staleTime: Infinity,
  });
}

function useDataMutation<TVars>(mutate: (data: StudyData, vars: TVars) => StudyData) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: TVars) => repository.update((data) => mutate(data, vars)),
    onSuccess: (next) => qc.setQueryData(dataKey, next),
  });
}

export const useAddActivity = () =>
  useDataMutation<{ name: string; categoryId: CategoryId }>((data, vars) => {
    data.activities.push({
      id: newId(),
      name: vars.name.trim(),
      categoryId: vars.categoryId,
      favorite: false,
      createdAt: new Date().toISOString(),
    });
    return data;
  });

export const useUpdateActivity = () =>
  useDataMutation<{ id: string; patch: Partial<Activity> }>((data, { id, patch }) => {
    data.activities = data.activities.map((a) => (a.id === id ? { ...a, ...patch } : a));
    return data;
  });

export const useDeleteActivity = () =>
  useDataMutation<string>((data, id) => {
    data.activities = data.activities.filter((a) => a.id !== id);
    data.resources = data.resources.filter((r) => r.activityId !== id);
    data.deadlines = data.deadlines.filter((d) => d.activityId !== id);
    return data;
  });

export const useRestoreActivity = () =>
  useDataMutation<{ activity: Activity; resources: Resource[]; deadlines: Deadline[] }>(
    (data, { activity, resources, deadlines }) => {
      if (!data.activities.some((a) => a.id === activity.id)) {
        data.activities.push(activity);
        data.resources.push(...resources);
        data.deadlines.push(...deadlines);
      }
      return data;
    },
  );

export const useAddResource = () =>
  useDataMutation<Omit<Resource, "id">>((data, vars) => {
    data.resources.push({ ...vars, id: newId() });
    return data;
  });

export const useUpdateResource = () =>
  useDataMutation<{ id: string; patch: Partial<Omit<Resource, "id">> }>((data, { id, patch }) => {
    data.resources = data.resources.map((r) => (r.id === id ? { ...r, ...patch } : r));
    return data;
  });

export const useDeleteResource = () =>
  useDataMutation<string>((data, id) => {
    data.resources = data.resources.filter((r) => r.id !== id);
    return data;
  });

export const useAddDeadline = () =>
  useDataMutation<Omit<Deadline, "id">>((data, vars) => {
    data.deadlines.push({ ...vars, id: newId() });
    return data;
  });

export const useDeleteDeadline = () =>
  useDataMutation<string>((data, id) => {
    data.deadlines = data.deadlines.filter((d) => d.id !== id);
    return data;
  });

export const useAddSession = () =>
  useDataMutation<Omit<Session, "id">>((data, vars) => {
    data.sessions.push({ ...vars, id: newId() });
    return data;
  });

export const useUpdateSession = () =>
  useDataMutation<{ id: string; patch: Partial<Session> }>((data, { id, patch }) => {
    data.sessions = data.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s));
    return data;
  });

export const useDeleteSession = () =>
  useDataMutation<string>((data, id) => {
    data.sessions = data.sessions.filter((s) => s.id !== id);
    return data;
  });

export const useRestoreSession = () =>
  useDataMutation<Session>((data, session) => {
    if (!data.sessions.some((s) => s.id === session.id)) data.sessions.push(session);
    return data;
  });

export const useUpdateSettings = () =>
  useDataMutation<Partial<Settings>>((data, patch) => {
    data.settings = { ...data.settings, ...patch };
    return data;
  });

export const useImportData = () => useDataMutation<StudyData>((_data, imported) => imported);
