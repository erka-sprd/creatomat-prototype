import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // ?dtf=true — the DTF version: designs preview as patches, with none of
  // embroidery's limits or warnings.
  // ?resize=guide — embroidery's earlier resize: a lone object may grow past
  // the hoop frame, with the green hoop guide pointing back to its size.
  const { dtf, resize } = await searchParams
  return (
    <DesignerClient
      dtf={dtf === "true"}
      embroideryResizeGuide={resize === "guide"}
    />
  )
}
