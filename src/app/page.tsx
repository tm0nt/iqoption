import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/avalon";

/** The clone's entry point mirrors the source site: the default-locale login page. */
export default function Home() {
  redirect(`/${DEFAULT_LOCALE}/login`);
}
