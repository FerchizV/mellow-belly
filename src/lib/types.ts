export type Place = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  type: string;
  is_totally_vegan: boolean;
  lat: number;
  lng: number;
};

export type Review = {
  id: string;
  place_id: string;
  item_ordered: string;
  flavor_rating: number;
  comfort_score: number;
  notes: string | null;
  created_at: string;
};

export const COMFORT_FACES = ["🤢", "😣", "😐", "🙂", "😍"] as const;
export const COMFORT_LABELS = ["Sick", "Heavy", "Okay", "Good", "Amazing"] as const;
