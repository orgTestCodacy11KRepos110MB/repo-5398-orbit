import { OrbitAPI, OrbitAPIValidator } from "@withorbit/api";
import cookieParser from "cookie-parser";
import express from "express";
import morganBody from "morgan-body";
import { listEvents, storeEvents } from "./api/events";
import { bulkGetTasks } from "./api/tasks";
import {
  getAttachment,
  ingestAttachmentsFromURLs,
  storeAttachment,
} from "./api/attachments";
import { consumeAccessCode } from "./api/internal/auth/consumeAccessCode";
import { createLoginToken } from "./api/internal/auth/createLoginToken";
import { personalAccessTokens } from "./api/internal/auth/personalAccessTokens";
import { refreshSessionCookie } from "./api/internal/auth/refreshSessionCookie";
import { recordPageView } from "./api/internal/recordPageView";
import corsHandler from "./api/util/corsHandler";
import createTypedRouter from "./api/util/typedRouter";

const routeValidator = new OrbitAPIValidator({
  allowUnsupportedRoute: true,
  mutateWithDefaultValues: true,
});

export function createAPIApp(): express.Application {
  const app = express();
  app.use(corsHandler);
  app.use(cookieParser());

  // HACK: When the Firebase cloud function running this Express app is routed through its Firebase Hosting mount point (i.e. https://withorbit.com/api), there'll be an extra /api prefix which won't be present when the function is invoked directly. So we remove it here.
  app.use((request, _, next) => {
    if (request.headers["x-forwarded-host"] && request.url.startsWith("/api")) {
      request.url = request.url.slice("/api".length);
    }
    next();
  });

  morganBody(app, {
    maxBodyLength: 10000,
    noColors: true,
  }); // Log request and response data.

  createTypedRouter<OrbitAPI.Spec>(app, routeValidator, {
    "/attachments/ingestFromURLs": {
      POST: ingestAttachmentsFromURLs,
    },
    "/attachments/:id": {
      GET: getAttachment,
      POST: storeAttachment,
    },
    "/events": {
      PATCH: storeEvents,
      GET: listEvents,
    },
    "/tasks/bulkGet": {
      POST: bulkGetTasks,
    },
  });

  app.post("/internal/auth/personalAccessTokens", personalAccessTokens);

  // These older auth APIs need some rethinking...
  app.get("/internal/auth/createLoginToken", createLoginToken);
  app.get("/internal/auth/consumeAccessCode", consumeAccessCode);
  app.get("/internal/auth/refreshSessionCookie", refreshSessionCookie);

  app.post("/internal/recordPageView", recordPageView);

  return app;
}
