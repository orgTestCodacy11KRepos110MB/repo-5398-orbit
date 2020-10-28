import { differenceInDays } from "date-fns";
import { UserMetadata } from "metabook-firebase-support";

export function shouldEvaluateUserForNotification(
  userMetadata: UserMetadata,
  evaluationTimestampMillis: number,
) {
  if (
    differenceInDays(
      evaluationTimestampMillis,
      userMetadata.registrationTimestampMillis,
    ) < 1
  ) {
    console.log("Registered too recently");
    return false;
  }

  // TODO: skip if unsubscribed
  // TODO: skip if last notification was too recent (only relevant once time zones implemented)
  // TODO: if their current pending notification is more than a month old, don't bother
  // TODO: skip if time is inappropriate in their time zone

  return true;
}
