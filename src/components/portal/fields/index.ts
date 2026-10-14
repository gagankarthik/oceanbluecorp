// Shared inputs for portal forms; one component per field pattern (recruiting brief §11).
export {
  inputCls, textareaCls, Field, FieldError, FieldWarning, TextInput, TextArea, NativeSelect, CheckRow, Choice,
  Notice, FormBanner, FormSection, SectionBadge, StickyActions,
} from "./base";
export { LocationInput, type LocationValue } from "./LocationInput";
export { WorkAuthInput, workAuthNote, type WorkAuthValue } from "./WorkAuthInput";
export { MoneyInput, RateInput, RangeInput, MarginPreview, moneyValue, RATE_UNITS } from "./money";
export { StaffPicker, StaffMultiPicker, useStaff, type StaffPerson } from "./StaffPicker";
export { StageSelect, stageOptions } from "./StageSelect";
export { RatingInput } from "./RatingInput";
export { ResumeDrop, resumeFileError, RESUME_ACCEPT, RESUME_HINT, RESUME_MAX_BYTES } from "./ResumeDrop";
export { SkillsInput, SKILLS_MAX, SKILL_MAX_CHARS } from "./SkillsInput";
export { JobPicker, jobOptionLabel } from "./JobPicker";
export { PartnerPicker, AddClientDialog, AddVendorDialog, type NewClientInput, type NewVendorInput } from "./PartnerPicker";
