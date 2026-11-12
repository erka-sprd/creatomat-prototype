import type { Metadata } from "next"

import ViewStripVariantsPage from "@/components/view-strip-variants-page"

// TEMPORARY — the views strip's variants, to pick one.

export const metadata: Metadata = {
  title: "View strip variants · Creatomat prototype",
}

export default function Page() {
  return <ViewStripVariantsPage />
}
