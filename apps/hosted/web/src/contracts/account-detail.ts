/** One account's detail, which account, app and connection changes acknowledge or read again. */
import { hydrated } from "@executor-js/ui/contracts/http";
import { revalidated } from "@executor-js/ui/contracts/refresh";
import type { AccountId } from "@executor-js/sdk";
import type { OrganizationReference } from "@executor-js/hosted-server/organization";
import { Data } from "effect";
import { Atom } from "effect/reactivity";
import { HostedClient } from "./api.ts";
import { protectedQuery } from "./protected-query.ts";

/** Account queries remain independent across organizations, including OAuth returns. */
export class AccountKey extends Data.Class<{
  readonly organization: OrganizationReference;
  readonly account: AccountId;
}> {}
const accountQuery = Atom.family((key: AccountKey) =>
  HostedClient.query("accounts", "get", hydrated({ params: key })).pipe(
    revalidated,
    protectedQuery,
  ),
);
export const accountAtom = (key: {
  readonly organization: OrganizationReference;
  readonly account: AccountId;
}) => accountQuery(new AccountKey(key));
