import { createContext, useContext } from "react";
import type {
  OrganizationAccess,
  OrganizationId,
  OrganizationReference,
} from "@executor-js/hosted-server/organization";

/**
 * The organization the URL names, provided by `OrganizationBoundary`. It lives apart from the
 * boundary so the dashboard bindings the boundary renders can read it without importing it.
 */
export const OrganizationRouteContext = createContext<{
  readonly organization: OrganizationReference;
  readonly slug: string;
  readonly role: OrganizationAccess["role"] | undefined;
  readonly id: OrganizationId | undefined;
  readonly name: string | undefined;
  readonly unavailable: boolean;
  /** Whether the page may render; see `useGuardedPreload`. */
  readonly released: boolean;
  readonly metadataFailed: boolean;
  readonly retry: () => void;
} | null>(null);
/** The URL target is immediately usable by page requests, independently of sidebar metadata. */
export function useOrganizationRoute() {
  const value = useContext(OrganizationRouteContext);
  if (value === null) throw new Error("Organization route context is missing");
  return value;
}
