import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

export const useAuthStore = create((set, get) => ({
  session: null,
  profile: null,
  initialized: false, // true once we've checked for an existing session

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, initialized: true });
    if (session) get().fetchProfile();

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) get().fetchProfile();
      else set({ profile: null });
    });
  },

  fetchProfile: async () => {
    const uid = get().session?.user?.id;
    if (!uid) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (!error) set({ profile: data });
  },

  signup: async ({ name, email, password }) => {
    const clean = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: clean,
      password,
      options: { data: { name: name?.trim() || "" } },
    });
    if (error) return { ok: false, error: error.message };
    // The profiles row is created server-side by a trigger (see supabase/schema.sql).
    if (data.session) set({ session: data.session });
    return { ok: true, needsEmailConfirm: !data.session };
  },

  login: async ({ email, password }) => {
    const clean = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
    if (error) return { ok: false, error: error.message };
    set({ session: data.session });
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  updateProfile: async (patch) => {
    const uid = get().session?.user?.id;
    if (!uid) return { ok: false, error: "Not signed in." };
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", uid)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    set({ profile: data });
    return { ok: true };
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const email = get().session?.user?.email;
    if (!email) return { ok: false, error: "Not signed in." };
    if (!newPassword || newPassword.length < 6) return { ok: false, error: "New password should be at least 6 characters." };

    // Re-verify identity with the current password before allowing the change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) return { ok: false, error: "Current password is incorrect." };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  /** Shape-compatible with the old localStorage version, so components
   *  reading `currentUser()` didn't need to change. */
  currentUser: () => {
    const { session, profile } = get();
    if (!session) return null;
    return { email: session.user.email, profile: profile || {} };
  },
}));
