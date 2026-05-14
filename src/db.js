import { supabase } from "./supabase.js";

// ── UPSERT + CLEANUP (stock inventory) ──
export const upsertAndClean = async (table, rows, idField = "id", label) => {
  if (!rows.length) return;
  const { error: e1 } = await supabase.from(table).upsert(rows, { onConflict: idField });
  if (e1) throw new Error(`${label || table} upsert: ${e1.message}`);
  const ids = rows.map(r => r[idField]).filter(Boolean);
  if (ids.length) {
    const isList = typeof ids[0] === "string"
      ? ids.map(i => `'${i}'`).join(",")
      : ids.join(",");
    const { error: e2 } = await supabase.from(table).delete().not(idField, "in", `(${isList})`);
    if (e2) throw new Error(`${label || table} cleanup: ${e2.message}`);
  }
};

// ── UPSERT APP STATE (key-value JSON store) ──
export const saveAppState = async (key, data, label) => {
  const { error } = await supabase.from("app_state").upsert({
    key, data, updated_at: new Date().toISOString()
  });
  if (error) throw new Error(`${label || key}: ${error.message}`);
};

// ── FETCH TABLE (simple select *) ──
export const fetchAll = async (table) => {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`fetch ${table}: ${error.message}`);
  return data || [];
};
