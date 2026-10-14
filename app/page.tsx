import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // ?embroidery=true — the embroidery version of the designer, as create-omat
  // launches it with the same param.
  const { embroidery } = await searchParams
  return <DesignerClient embroidery={embroidery === "true"} />
}
