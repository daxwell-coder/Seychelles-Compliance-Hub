import { z } from "zod";

// Reusable ISO date string validator (basic parseable check)
export const isoDateString = z.string().refine(v => !isNaN(Date.parse(v)), { message: "Must be a valid ISO date string" });

export const BeneficialOwnerSchema = z.object({
  fullName: z.string().min(1, "Full name cannot be empty."),
  residentialAddress: z.string().min(1, "Residential address cannot be empty."),
  serviceAddress: z.string().min(1, "Service address cannot be empty."),
  dateOfBirth: isoDateString,
  nationality: z.string().length(2, "Nationality must be a 2-letter ISO code."),
  nationalIdNumber: z.string().min(1, "National ID number cannot be empty."),
  taxIdNumber: z.string().min(1, "Tax ID number cannot be empty."),
  dateBecameBo: isoDateString,
});

export const OnboardingDataSchema = z.object({
  clientName: z.string().min(1, "Client name cannot be empty."),
  clientRequestId: z.string().uuid().optional(),
  beneficialOwners: z.array(BeneficialOwnerSchema).min(1, "At least one beneficial owner is required."),
});

export type OnboardingData = z.infer<typeof OnboardingDataSchema>;
