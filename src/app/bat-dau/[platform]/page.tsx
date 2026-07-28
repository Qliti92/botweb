import { redirect } from "next/navigation";

export default async function ConversionLandingPage({ params }: { params: Promise<{ platform: string }> }) {
  await params;
  redirect("/bat-dau");
}
