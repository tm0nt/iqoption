/**
 * The query parameters an affiliate link may carry.
 *
 * Its own module, with nothing imported, because the middleware reads it on
 * every request and should not pull the database client in behind it.
 */
export const TRACKING_PARAMS = ["ref", "sub", "utm_source", "utm_medium", "utm_campaign"] as const;
