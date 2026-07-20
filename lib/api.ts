import { Member, State, Settings } from "./types";
import { supabase } from "./supabaseClient";

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("states")
    .select("member_id, name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((s) => ({ id: s.member_id, name: s.name }));
}

export async function getStates(): Promise<{ states: State[] }> {
  const { data, error } = await supabase
    .from("states")
    .select("*");

  if (error) {
    throw error;
  }

  const states: State[] = (data ?? []).map((s) => ({
    memberId: s.member_id,
    name: s.name,
    location: s.location ?? "",
    returnTime: s.return_time ?? "",
    updatedAt: s.updated_at,
  }));

  return { states };
}

export async function updateState(
  id: number,
  location: string,
  returnTime: string
): Promise<void> {
  const { error } = await supabase
    .from("states")
    .update({
      location,
      return_time: returnTime,
      updated_at: new Date().toISOString(),
    })
    .eq("member_id", id);

  if (error) {
    throw error;
  }
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    throw error;
  }

  return {
    department: data.department ?? "",
    employeeName: data.employee_name ?? "",
    intervalSeconds: data.interval_seconds ?? 10,
    lastAccidentDate: data.last_accident_date ?? "",
    weatherSource: data.weather_source ?? "",
    imagePath: data.image_path ?? null,
    updatedAt: data.updated_at,
  };
}

export async function updateSettings(
  settings: Omit<Settings, "updatedAt">,
  imageFile?: File | null
): Promise<void> {
  let imagePath = settings.imagePath;

  if (imageFile) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `icon-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("settings-images")
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("settings-images")
      .getPublicUrl(fileName);

    imagePath = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from("settings")
    .update({
      department: settings.department,
      employee_name: settings.employeeName,
      interval_seconds: settings.intervalSeconds,
      last_accident_date: settings.lastAccidentDate,
      weather_source: settings.weatherSource,
      image_path: imagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    throw error;
  }
}
