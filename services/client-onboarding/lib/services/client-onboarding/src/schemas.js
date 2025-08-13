"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingDataSchema = exports.BeneficialOwnerSchema = exports.isoDateString = void 0;
const zod_1 = require("zod");
// Reusable ISO date string validator (basic parseable check)
exports.isoDateString = zod_1.z.string().refine(v => !isNaN(Date.parse(v)), { message: "Must be a valid ISO date string" });
exports.BeneficialOwnerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, "Full name cannot be empty."),
    residentialAddress: zod_1.z.string().min(1, "Residential address cannot be empty."),
    serviceAddress: zod_1.z.string().min(1, "Service address cannot be empty."),
    dateOfBirth: exports.isoDateString,
    nationality: zod_1.z.string().length(2, "Nationality must be a 2-letter ISO code."),
    nationalIdNumber: zod_1.z.string().min(1, "National ID number cannot be empty."),
    taxIdNumber: zod_1.z.string().min(1, "Tax ID number cannot be empty."),
    dateBecameBo: exports.isoDateString,
});
exports.OnboardingDataSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1, "Client name cannot be empty."),
    clientRequestId: zod_1.z.string().uuid().optional(),
    beneficialOwners: zod_1.z.array(exports.BeneficialOwnerSchema).min(1, "At least one beneficial owner is required."),
});
//# sourceMappingURL=schemas.js.map