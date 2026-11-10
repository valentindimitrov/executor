/** Read, lock and insert stored app rows, shared by app operations, authoring and the registry. */
import { Effect, Schema } from "effect";
import { SqlError } from "effect/sql";
import { AppNameTaken, AppNotDeployed, AppNotFound, AppSlugTaken } from "../contracts/apps.ts";
import { VersionNotFound } from "../contracts/version.ts";
import type { Executor } from "../contracts/executor.ts";
import { OwnerId, StorageError, VersionId } from "../contracts/shared.ts";
import { StoredApp, StoredVersion } from "../contracts/storage.ts";
import { query, type Query } from "./database.ts";

export const storedApp = (db: Query, input: Parameters<Executor["apps"]["get"]>[0]) =>
  Effect.gen(function* () {
    const row = yield* query(() =>
      db.findFirst("apps", {
        where: (b) =>
          b.and(
            b("id", "=", input.app),
            input.owner === undefined ? true : b("owner", "=", input.owner),
          ),
      }),
    );
    if (row === null) return yield* Effect.fail(new AppNotFound({ app: input.app }));
    return yield* Schema.decodeUnknownEffect(StoredApp)(row).pipe(
      Effect.mapError(() => new StorageError()),
    );
  });

/** Lock the app before changing selections or version; only write its immutable code identity, then reread. */
export const lockApp = (db: Query, input: Parameters<Executor["apps"]["get"]>[0]) =>
  Effect.gen(function* () {
    const app = yield* storedApp(db, input);
    yield* query(() =>
      db.updateMany("apps", {
        where: (b) => b.and(b("id", "=", app.id), b("code", "=", app.code)),
        set: { code: app.code },
      }),
    );
    return yield* storedApp(db, input);
  });

/** Read a version from this app's lineage, including its retained source and requirements. */
export const storedVersion = (
  db: Query,
  app: Pick<StoredApp, "id" | "code" | "activeVersion">,
  version: VersionId | null = app.activeVersion,
  versionOwner?: OwnerId,
) =>
  Effect.gen(function* () {
    if (version === null) return yield* new AppNotDeployed({ app: app.id });
    const row = yield* query(() =>
      db.findFirst("deployments", {
        where: (b) =>
          b.and(
            b("id", "=", version),
            b("code", "=", app.code),
            versionOwner === undefined ? true : b("owner", "=", versionOwner),
          ),
      }),
    );
    if (row === null) return yield* Effect.fail(new VersionNotFound({ app: app.id, version }));
    return yield* Schema.decodeUnknownEffect(StoredVersion)(row).pipe(
      Effect.mapError(() => new StorageError()),
    );
  });

/** Translate atomic name/address constraints without hiding unrelated database failures. */
export const appWriteFailure =
  (app: Pick<StoredApp, "owner" | "name" | "slug">) => (error: unknown) => {
    if (SqlError.isSqlError(error) && Schema.is(SqlError.UniqueViolation)(error.reason)) {
      if (error.reason.constraint === "executor_apps_owner_name")
        return new AppNameTaken({ owner: app.owner, name: app.name });
      if (error.reason.constraint === "executor_apps_owner_slug")
        return new AppSlugTaken({ owner: app.owner, slug: app.slug });
    }
    return new StorageError();
  };
/** Insert app identity while preserving name and derived-slug uniqueness errors. */
export const createApp = (db: Query, app: StoredApp) => {
  // Storage keeps the column's former name.
  const { activeVersion, ...row } = app;
  return db
    .create("apps", { ...row, activeDeployment: activeVersion })
    .pipe(Effect.mapError(appWriteFailure(app)));
};
