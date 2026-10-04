/**
 * The shape the market server's `/top-assets` returns.
 *
 * In its own module because a client component imports it, and the module that
 * fetches it reaches for `process.env` and `fetch` with a server-side timeout —
 * importing that from the browser bundle would drag the server's half along.
 */
export type TopAsset = {
  id: number;
  ticker: string;
  name: string;
  kind: string;
  precision: number;
  source: string;
  /** The latest price the feed has. */
  price: number;
  /** Percent moved over the window, signed. */
  change: number;
  /** Evenly spaced samples across the window, oldest first. */
  series: number[];
};
