import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

// Same designer as "/", with customer-service mode enabled.
export default function Page() {
  return <DesignerClient csMode />
}
