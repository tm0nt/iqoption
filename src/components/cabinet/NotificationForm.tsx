"use client";

import { CheckRow, Toggle } from "./Toggle";
import { EMAIL_TOPICS, type NotificationSettings } from "@/lib/cabinet/notifications";
import { cabinetCopy } from "@/i18n/cabinet";
import { ProfileSection } from "./ProfileSection";

/** One `{key, value}` write, which is how every switch on these pages saves. */
async function save(key: string, value: boolean) {
  const response = await fetch("/api/profile/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  }).catch(() => null);

  if (!response?.ok) {
    const said = await response?.json().catch(() => null);
    return { error: said?.error ?? "could not save that" };
  }
  return {};
}

export function NotificationForm({
  settings,
  locale,
}: {
  settings: NotificationSettings;
  locale: string;
}) {
  const copy = cabinetCopy(locale).notifications;

  return (
    <>
      <ProfileSection
        title={copy.emailTitle}
        aside={<Toggle checked={settings.email} label={copy.emailTitle} onSave={(v) => save("email", v)} />}
      >
        <p>{copy.emailBody}</p>

        {/* The list is always shown. The live page leaves it in place with the
            switch off, which is what lets someone set their topics before
            turning e-mail back on. */}
        <div className="pt-4">
          {EMAIL_TOPICS.map((topic) => (
            <CheckRow
              key={topic.key}
              label={copy.topics[topic.key] ?? topic.label}
              checked={settings[topic.key]}
              onSave={(v) => save(topic.key, v)}
            />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title={copy.pushTitle}
        aside={<Toggle checked={settings.push} label={copy.pushTitle} onSave={(v) => save("push", v)} />}
      >
        <p>{copy.pushBody}</p>
        <p>{copy.pushAside}</p>
      </ProfileSection>

      <ProfileSection
        title={copy.callsTitle}
        aside={<Toggle checked={settings.calls} label={copy.callsTitle} onSave={(v) => save("calls", v)} />}
      >
        <p>{copy.callsBody}</p>
      </ProfileSection>

      <ProfileSection
        title={copy.consentTitle}
        last
        aside={<Toggle checked={settings.marketing} label={copy.consentTitle} onSave={(v) => save("marketing", v)} />}
      >
        <p>{copy.consentBody}</p>
      </ProfileSection>
    </>
  );
}
