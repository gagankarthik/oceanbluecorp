import { FormSkeleton } from "@/components/portal/kit/skeletons";

// Same shape as the form: back link, title, three sections, action bar.
export default function EditApplicationLoading() {
  return <FormSkeleton label="Loading applicant" sections={3} />;
}
