import { supabase } from "./supabase.js";

export const HWK_STATUS = ["À faire", "En cours", "Fait", "Corrigé"];

export const HWK_COLOR = {
  "À faire": "#b4560f",
  "En cours": "#0e9fb2",
  Fait: "#12a07a",
  Corrigé: "#6b7f8a",
};

export // Coche / décoche un devoir (utilisé par l'Aperçu ET l'onglet Devoirs → même état, même sauvegarde)
async function hwkToggleDone(setRows, r) {
  const isDone = r.status === "Fait" || r.status === "Corrigé",
    now = new Date().toISOString(),
    patch = isDone
      ? {
          status: "À faire",
          submitted_at: null,
          updated_at: now,
        }
      : {
          status: "Fait",
          submitted_at: now,
          updated_at: now,
        };
  setRows((p) =>
    p.map((x) =>
      x.id === r.id
        ? {
            ...x,
            ...patch,
          }
        : x,
    ),
  );
  await supabase.from("vision_homework").update(patch).eq("id", r.id);
}
