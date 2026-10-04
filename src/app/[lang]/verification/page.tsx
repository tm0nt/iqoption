import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { PersonalDetailsForm } from "@/components/cabinet/PersonalDetailsForm";
import { VerificationStepper, type Step } from "@/components/cabinet/VerificationStepper";
import { prisma } from "@/lib/db";
import { countryName } from "@/lib/cabinet/countries";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Account Verification" };
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The flag for a two-letter country code, from its regional indicators. */
function flagOf(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/** "October 2, 2026", as the cabinet writes a registration date. */
function longDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/verification`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: {
      email: true,
      emailVerified: true,
      createdAt: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      citizenship: true,
      isUsPerson: true,
      kycStatus: true,
      phoneCountry: true,
      activeBalanceId: true,
      balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
    },
  });
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const detailsDone = user.kycStatus !== "NONE";

  /*
   * The rail reads as progress, so each step's state comes from the one before
   * it: the details step is only "current" once the address is confirmed, and
   * the document step only once the details are in.
   */
  const steps: Step[] = [
    {
      label: "Email confirmation",
      note: user.emailVerified ? "Done" : "Pending",
      state: user.emailVerified ? "done" : "current",
    },
    {
      /*
       * Not gated on the address being confirmed. The live site is, but we have
       * no way to send a confirmation yet, and a rail that waits on a message
       * nobody sends is a page that can never be used. The gate comes back when
       * the mail does.
       */
      label: "Personal Details",
      note: detailsDone ? "Done" : undefined,
      state: detailsDone ? "done" : "current",
    },
    {
      label: "Proof of Identity",
      state: user.kycStatus === "APPROVED" ? "done" : detailsDone ? "current" : "todo",
    },
  ];

  const residence = user.phoneCountry || "BR";

  return (
    <CabinetShell
      locale={lang}
      account={{
        email: user.email,
        balance: wallet ? `${MONEY.format(Number(wallet.amount))} ${wallet.currency}` : "0.00",
        balanceLabel: wallet?.type === 4 ? "Practice account" : "Real account",
        verified: user.kycStatus === "APPROVED",
      }}
      wide
    >
      <div className="flex items-start justify-between gap-6 pt-7">
        <h1 className="flex items-center gap-2 text-[16px] font-medium text-avalon-text">
          Account Verification
          <span className="flex size-4 items-center justify-center rounded-full border border-avalon-border-muted text-[10px] text-avalon-text">
            ?
          </span>
        </h1>
        <p className="text-right text-[12px] leading-5 text-avalon-text">
          Date registered: {longDate(user.createdAt)}
          <br />
          Profile ID: {session.user.platformId}
        </p>
      </div>

      <hr className="mt-5 border-avalon-surface-hover" />

      <div className="mt-10 flex gap-10">
        <VerificationStepper steps={steps} />

        <div className="min-w-0 grow">
          {detailsDone && user.kycStatus !== "REJECTED" ? (
            <div className="mx-auto max-w-[620px] py-10 text-center">
              <h2 className="text-[24px] font-semibold text-avalon-text-strong">Proof of Identity</h2>
              <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">
                Your details are with us. The next step is a photo of an identity document, which a person reads
                against what you entered.
              </p>
              <p className="mt-8 rounded-[2px] bg-avalon-surface px-6 py-5 text-[14px] leading-[22px] text-avalon-text">
                Document upload is not built yet. Until it is, an account stays on the practice balance.
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-[620px] text-center">
                <h2 className="text-[24px] font-semibold text-avalon-text-strong">Personal Details</h2>
                <p className="mt-5 text-[15px] leading-[26px] text-avalon-text">
                  Providing correct personal information will facilitate the verification of your account and its
                  funding. The details you provide will be kept confidential.
                </p>
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
