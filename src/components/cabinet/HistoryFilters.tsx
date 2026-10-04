"use client";

import { useRouter } from "next/navigation";

export type FilterOption = { value: string; label: string };

/**
 * The filter row above a history table.
 *
 * It navigates rather than holding state: the filters belong in the URL, so a
 * filtered view can be linked, reloaded and gone back to. That also means the
 * query runs on the server with the filter applied, instead of the page
 * fetching everything and hiding most of it.
 */
export function HistoryFilters({
  basePath,
  current,
  groups,
}: {
  basePath: string;
  current: Record<string, string>;
  groups: { name: string; label: string; options: FilterOption[] }[];
}) {
  const router = useRouter();

  function set(name: string, value: string) {
    const params = new URLSearchParams(current);
    if (value === "all" || value === "") params.delete(name);
    else params.set(name, value);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    /*
     * The controls share the row rather than taking the live site's fixed width,
     * which is 248px where there are four of them and 333px where there are
     * three — the same 1032px column divided by what is in it. Sharing gets both
     * from one component, and still wraps when the row is genuinely too narrow.
     */
    <div className="flex flex-wrap gap-3.5">
      {groups.map((group) => (
        <label key={group.name} className="block min-w-[180px] flex-1 basis-[200px]">
          <span className="mb-1.5 block text-[14px] font-medium text-avalon-text">{group.label}</span>
          <span className="relative block">
            <select
              value={current[group.name] ?? "all"}
              onChange={(event) => set(group.name, event.target.value)}
              className="h-[50px] w-full appearance-none rounded-[4px] border border-avalon-border bg-white py-2.5 pl-5 pr-[38px] text-[14px] font-medium text-avalon-text outline-none transition-colors focus:border-avalon-primary"
            >
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              width="10"
              height="6"
              viewBox="0 0 10 6"
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-avalon-text"
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </label>
      ))}

      <label className="block min-w-[180px] flex-1 basis-[200px]">
        <span className="mb-1.5 block text-[14px] font-medium text-avalon-text">Date</span>
        <span className="flex h-[50px] w-full items-center rounded-[4px] border border-avalon-border bg-white">
          <span className="flex size-[50px] shrink-0 items-center justify-center border-r border-avalon-border text-avalon-primary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <rect x="1" y="3" width="16" height="14" rx="2" />
              <path d="M1 7h16M5.5 1v3M12.5 1v3" />
            </svg>
          </span>
          <input
            type="date"
            value={current.from ?? ""}
            onChange={(event) => set("from", event.target.value)}
            className="w-full bg-transparent px-3 text-[13px] font-medium text-avalon-text outline-none"
          />
        </span>
      </label>
    </div>
  );
}
