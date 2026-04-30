export type DrugCategoryOption = {
  id: number;
  name: string;
  /**
   * Stable key stored in DB / sent to API.
   * Keep this unchanged once data exists.
   */
  value: string;
};

// Simple, easy-to-understand categories for day-to-day pharmacy work.
export const DRUG_CATEGORIES: DrugCategoryOption[] = [
  { id: 1, name: "Pain & fever", value: "pain_fever" },
  { id: 2, name: "Antibiotics", value: "antibiotics" },
  { id: 3, name: "Malaria medicines", value: "malaria" },
  { id: 4, name: "Deworming (worms)", value: "deworming" },
  { id: 5, name: "Diarrhea & ORS", value: "diarrhea_ors" },
  { id: 6, name: "Stomach acid / ulcer", value: "stomach_acid_ulcer" },
  { id: 7, name: "Allergy & itching", value: "allergy" },
  { id: 8, name: "Cough & cold", value: "cough_cold" },
  { id: 9, name: "Asthma / breathing", value: "asthma" },
  { id: 10, name: "Blood pressure", value: "hypertension" },
  { id: 11, name: "Diabetes", value: "diabetes" },
  { id: 12, name: "Family planning", value: "family_planning" },
  { id: 13, name: "Pregnancy / mothers", value: "pregnancy" },
  { id: 14, name: "Skin", value: "skin" },
  { id: 15, name: "Fungal", value: "fungal" },
  { id: 16, name: "Eye / ear", value: "eye_ear" },
  { id: 17, name: "Vitamins", value: "vitamins" },
  { id: 18, name: "Other", value: "other" },
];
