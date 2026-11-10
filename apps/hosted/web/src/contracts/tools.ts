/**
 * The app's tool catalog, evaluated with its linked accounts: the schema-free index, one tool's
 * schemas, and the lists the browser and connection search read from it.
 */
import { hydrated } from "@executor-js/ui/contracts/http";
import { revalidated } from "@executor-js/ui/contracts/refresh";
import { currentQuery } from "@executor-js/ui/contracts/mutations";
import type { ToolCatalog } from "@executor-js/ui/contracts/dashboard";
import type { AppId, ToolName, VersionId } from "@executor-js/sdk";
import type { OrganizationReference } from "@executor-js/hosted-server/organization";
import { Data, Effect } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { HostedClient } from "./api.ts";
/**
 * One page evaluates the current app catalog with the app's linked accounts, read again after the
 * caller links, unlinks or connects one.
 */
class ToolKey extends Data.Class<{
  readonly organization: OrganizationReference;
  readonly app: AppId;
  readonly version?: VersionId | undefined;
}> {}
/**
 * Browsing reads the schema-free index; one tool's schemas load when it is selected. A refresh
 * shows the catalog loading rather than the previous one: the key does not name the linked
 * accounts, so a retained catalog may belong to accounts that are no longer linked.
 */
const toolsQuery = Atom.family((key: ToolKey) =>
  HostedClient.query(
    "tools",
    "index",
    hydrated({
      params: key,
      query: { version: key.version },
    }),
  ).pipe(revalidated, currentQuery),
);
export const toolsAtom = (key: ConstructorParameters<typeof ToolKey>[0]) =>
  toolsQuery(new ToolKey(key));

const toolCatalogs = Atom.family((key: ToolKey) =>
  Atom.map(
    toolsQuery(key),
    AsyncResult.map((page): ToolCatalog => ({ tools: page.items, routers: page.routers })),
  ),
);
/** Shared browser view for the page's accounts, with the routers that group its tools. */
export const toolCatalogAtom = (key: ConstructorParameters<typeof ToolKey>[0]) =>
  toolCatalogs(new ToolKey(key));
class ToolDetailKey extends Data.Class<
  ConstructorParameters<typeof ToolKey>[0] & { readonly tool: ToolName }
> {}
const toolDetailQueries = Atom.family((key: ToolDetailKey) =>
  HostedClient.query(
    "tools",
    "get",
    hydrated({
      params: { organization: key.organization, app: key.app, tool: key.tool },
      query: { version: key.version },
    }),
  ).pipe(revalidated),
);
const toolDetails = Atom.family((key: ToolDetailKey) =>
  HostedClient.runtime.atom((get) =>
    get
      .result(toolDetailQueries(key))
      // A tool that left the catalog since the list was read is not a failure.
      .pipe(Effect.catchTag("ToolNotFound", () => Effect.succeed(undefined))),
  ),
);
/** One tool's schemas for the same catalog identity as the list. */
export const toolDetailAtom = (key: ConstructorParameters<typeof ToolDetailKey>[0]) =>
  toolDetails(new ToolDetailKey(key));

/** Connection search reads the whole schema-free index, so it includes every tool. */
const connectionToolLists = Atom.family((key: ToolKey) =>
  Atom.map(
    toolsQuery(key),
    AsyncResult.map((index) => index.items),
  ),
);
export const connectionToolListAtom = (key: ConstructorParameters<typeof ToolKey>[0]) =>
  connectionToolLists(new ToolKey(key));
