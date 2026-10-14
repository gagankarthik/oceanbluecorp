import { FormSkeleton } from "@/components/portal/kit/skeletons";

// Same shape ArticleEditor shows while it loads.
export default function Loading() {
  return <FormSkeleton label="Loading post" aside />;
}
