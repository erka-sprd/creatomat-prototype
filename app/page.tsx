import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // ?embroidery=true — the embroidery version of the designer, as create-omat
  // launches it with the same param. ?dtf=true — the DTF version: designs
  // preview as patches, with none of embroidery's limits or warnings.
  const { embroidery, dtf } = await searchParams
  return <DesignerClient embroidery={embroidery === "true"} dtf={dtf === "true"} />
}
