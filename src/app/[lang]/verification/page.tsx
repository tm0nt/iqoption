import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { PersonalDetailsForm } from "@/components/cabinet/PersonalDetailsForm";
import { VerificationStepper, type Step } from "@/components/cabinet/VerificationStepper";
import { countryName } from "@/lib/cabinet/countries";
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
  const { user, account, brand } = await loadCabinet(lang, `/${lang}/verification`);

  const detailsDone = user.kycStatus !== "NONE";

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
          {user.kycStatus === "APPROVED" ? (
            <div className="mx-auto max-w-[620px] py-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-avalon-primary/10 text-[22px] text-avalon-primary">✓</span>
              <h2 className="mt-4 text-[24px] font-semibold text-avalon-text-strong">{v.title}</h2>
              <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">{x.kycApproved}</p>
            </div>
          ) : detailsDone && user.kycStatus !== "REJECTED" ? (
            <div className="mx-auto max-w-[620px] py-10 text-center">
              <h2 className="text-[24px] font-semibold text-avalon-text-strong">{v.identityStep}</h2>
              <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">
                {v.identityPending}
              </p>
              <p className="mt-8 rounded-[2px] bg-avalon-surface px-6 py-5 text-[14px] leading-[22px] text-avalon-text">{v.uploadMissing}</p>
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
