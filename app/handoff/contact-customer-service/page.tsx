import type { Metadata } from "next"
import ContactCustomerService from "@/components/handoff/contact-customer-service"

export const metadata: Metadata = {
  title: "Contact customer service · Handoff",
  description:
    "Handoff for the Contact dropdown and the bulk-order panel — desktop and mobile, with live demos.",
}

export default function Page() {
  return <ContactCustomerService />
}
