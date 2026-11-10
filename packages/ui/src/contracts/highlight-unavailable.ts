import { Schema } from "effect";
/** Syntax highlighting can fail without preventing source inspection. */
export class HighlightUnavailable extends Schema.TaggedError<HighlightUnavailable>()(
  "HighlightUnavailable",
  {},
) {}
