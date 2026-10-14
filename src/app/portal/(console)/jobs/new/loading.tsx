import { FormSkeleton } from "@/components/portal/kit/skeletons";

// Same shape as the job form: header, then its step cards.
export default function Loading() {
  return <FormSkeleton label="Loading job form" sections={3} />;
}
