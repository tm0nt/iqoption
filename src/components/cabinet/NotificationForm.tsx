"use client";

import { CheckRow, Toggle } from "./Toggle";
import { EMAIL_TOPICS, type NotificationSettings } from "@/lib/cabinet/notifications";
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

export function NotificationForm({ settings }: { settings: NotificationSettings }) {
  return (
    <>
      <ProfileSection
        title="Email Notifications"
        aside={<Toggle checked={settings.email} label="Email notifications" onSave={(v) => save("email", v)} />}
      >
        <p>Receive emails about new platform features and big events</p>

        {/* The list is always shown. The live page leaves it in place with the
            switch off, which is what lets someone set their topics before
            turning e-mail back on. */}
        <div className="pt-4">
          {EMAIL_TOPICS.map((topic) => (
            <CheckRow
              key={topic.key}
              label={topic.label}
              checked={settings[topic.key]}
              onSave={(v) => save(topic.key, v)}
            />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Push Notifications"
        aside={<Toggle checked={settings.push} label="Push notifications" onSave={(v) => save("push", v)} />}
      >
        <p>Get push notifications about the latest trading news.</p>
        <p>
          By turning off push notifications, you&apos;re missing out on important market news alerts
          in the Avalon Mobile App.
        </p>
      </ProfileSection>

      <ProfileSection
        title="Phone calls &amp; SMS"
        aside={<Toggle checked={settings.calls} label="Calls and SMS" onSave={(v) => save("calls", v)} />}
      >
        <p>Receive calls and SMS from our support team about special offers.</p>
      </ProfileSection>

      <ProfileSection
        title="Communication of Data"
        last
        aside={<Toggle checked={settings.marketing} label="Communication of data" onSave={(v) => save("marketing", v)} />}
      >
        <p>
          I hereby consent to the processing of my personal information by Avalon and its partners
          and related entities for marketing purposes which shall include in particular
          communicating with me to inform me about its products and/or services and/or offers as
          described above for the purpose of a more tailored marketing experience.
        </p>
      </ProfileSection>
    </>
  );
}
