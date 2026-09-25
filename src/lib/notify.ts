import { toast } from "sonner";

/** Shows an error toast and returns void, so it can be used as `return fail("...")`. */
export function fail(message: string): void {
  toast.error(message);
}
