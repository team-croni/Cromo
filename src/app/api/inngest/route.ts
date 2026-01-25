import { serve } from "inngest/next";
import { inngest } from "@inngest/client";
import { purgeUsers, purgeUsersEvent, processEmbeddings, processEmbeddingsScheduled, processTags, processTagsScheduled } from "@inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    purgeUsers,
    purgeUsersEvent,
    processEmbeddings,
    processEmbeddingsScheduled,
    processTags,
    processTagsScheduled
  ],
});