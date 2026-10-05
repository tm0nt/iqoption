import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { PersonalDetailsForm } from "@/components/cabinet/PersonalDetailsForm";
import { VerificationStepper, type Step } from "@/components/cabinet/VerificationStepper";
import { countryName } from "@/lib/cabinet/countries";
import { DocumentUploadForm } from "@/components/cabinet/DocumentUploadForm";
import { kycRules } from "@/lib/kyc/rules";
import { formatDateTime, localeTag } from "@/lib/cabinet/format";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { loadCabinet } from "@/lib/cabinet/profile";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";
import { ProfileHeader } from "@/components/cabinet/ProfileHeader";

export async function generateMetadata(props: PageProps<"/[lang]/verification">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).verification.title };
}
export const dynamic = "force-dynamic";

/** The flag for a two-letter country code, from its regional indicators. */
function flagOf(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/** `dd.mm.yyyy`, which is what the form shows and what an ID document prints. */
function formDate(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

export default async function VerificationPage(props: PageProps<"/[lang]/verification">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const v = cabinetCopy(lang).verification;
  const d = cabinetCopy(lang).personal;

  const x = cabinetExtra(lang).profile;
  const k = cabinetExtra(lang).kyc;
  const { user, account, brand } = await loadCabinet(lang, `/${lang}/verification`);
  const query = await props.searchParams;

  const [latest, rules] = await Promise.all([
    prisma.kycSubmission.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    kycRules(),
  ]);

  const detailsDone = user.kycStatus !== "NONE";
  const underReview = latest?.status === "PENDING";
  /*
   * Which panel the page shows. The details form comes first; then the
   * documents; then the wait for a reviewer. A rejection goes back to the
   * documents with the reviewer's reason, and the details can be reopened
   * from there in case the reason is that they were wrong.
   */
  const panel =
    user.kycStatus === "APPROVED"
      ? "verified"
      : !detailsDone || (query.step === "details" && !underReview)
        ? "details"
        : underReview
          ? "review"
          : "documents";

  const names = new Intl.DisplayNames([localeTag(lang)], { type: "region" });
  const countries = rules.countries.map((rule) => ({ code: rule.code, name: names.of(rule.code) ?? rule.code, documents: rule.documents }));
  const defaultCountry = countries.some((country) => country.code === user.citizenship) ? user.citizenship! : countries[0]?.code ?? "BR";

  /*
   * The rail reads as progress, so each step's state comes from the one before
   * it: the details step is only "current" once the address is confirmed, and
   * the document step only once the details are in.
   */
  const steps: Step[] = [
    {
      label: v.emailStep,
      note: user.emailVerified ? d.done : cabinetCopy(lang).history.pending,
      state: user.emailVerified ? "done" : "current",
    },
    {
      /*
       * Not gated on the address being confirmed. The live site is, but we have
       * no way to send a confirmation yet, and a rail that waits on a message
       * nobody sends is a page that can never be used. The gate comes back when
       * the mail does.
       */
      label: v.detailsStep,
      note: detailsDone ? d.done : undefined,
      state: detailsDone ? "done" : "current",
    },
    {
      label: v.identityStep,
      note: user.kycStatus === "APPROVED" ? d.done : underReview ? cabinetCopy(lang).history.pending : undefined,
      state: user.kycStatus === "APPROVED" ? "done" : detailsDone ? "current" : "todo",
    },
  ];

  const residence = user.phoneCountry || "BR";

  return (
    <CabinetShell locale={lang} account={account} brand={brand} wide>
      <div className="flex flex-col-reverse items-start justify-between gap-2 pt-5 sm:flex-row sm:gap-6 sm:pt-7">
        <h1 className="flex items-center gap-2 text-[16px] font-medium text-avalon-text">
          {v.title}
          <span className="flex size-4 items-center justify-center rounded-full border border-avalon-border-muted text-[10px] text-avalon-text">
            ?
          </span>
        </h1>
        {/* Same two lines as the profile pages, so the wording cannot drift. */}
        <ProfileHeader locale={lang} createdAt={user.createdAt} id={user.id} />
      </div>

      <hr className="mt-5 border-avalon-surface-hover" />

      <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:gap-10">
        <VerificationStepper steps={steps} />

        <div className="min-w-0 grow">
          {panel === "verified" ? (
            <div className="mx-auto max-w-[620px] py-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-avalon-primary/10 text-[22px] text-avalon-primary">✓</span>
              <h2 className="mt-4 text-[24px] font-semibold text-avalon-text-strong">{v.title}</h2>
              <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">{x.kycApproved}</p>
            </div>
          ) : panel === "review" ? (
            <div className="mx-auto max-w-[620px] py-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-[22px] text-amber-600">⏳</span>
              <h2 className="mt-4 text-[22px] font-semibold text-avalon-text-strong sm:text-[24px]">{k.reviewTitle}</h2>
              <p className="mt-4 text-[15px] leading-[26px] text-avalon-text">{k.reviewBody(formatDateTime(latest!.createdAt, lang))}</p>
            </div>
          ) : panel === "documents" ? (
            <div>
              <h2 className="text-[22px] font-semibold text-avalon-text-strong sm:text-[24px]">{v.identityStep}</h2>
              {latest?.status === "REJECTED" && (
                <div className="mt-4 rounded-[2px] bg-[#fdeff1] px-5 py-4 text-[14px] leading-[22px] text-avalon-danger">
                  <p className="font-semibold">{k.rejectedTitle}</p>
                  {latest.reason && (
                    <p className="mt-1">
                      {k.reason}: {latest.reason}
                    </p>
                  )}
                  <Link href={`/${lang}/verification?step=details`} className="mt-2 inline-block text-avalon-primary hover:underline">
                    {k.editDetails}
                  </Link>
                </div>
              )}
              <div className="mt-6">
                <DocumentUploadForm countries={countries} defaultCountry={defaultCountry} locale={lang} />
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-[620px] text-center">
                <h2 className="text-[22px] font-semibold text-avalon-text-strong sm:text-[24px]">{v.detailsStep}</h2>
                <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">{x.detailsLead}</p>
                {user.kycStatus === "REJECTED" && (
                  <p className="mt-5 rounded-[2px] bg-[#fdeff1] px-5 py-3 text-[14px] leading-[22px] text-avalon-danger">{x.kycRejected}</p>
                )}
              </div>

              <div className="mt-10">
                <PersonalDetailsForm
                  locale={lang}
                  defaults={{
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    dateOfBirth: formDate(user.dateOfBirth),
                    citizenship: user.citizenship ?? residence,
                    isUsPerson: user.isUsPerson,
                    residenceCountry: countryName(residence),
                    residenceFlag: flagOf(residence),
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </CabinetShell>
  );
}
