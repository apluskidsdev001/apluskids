const START_EVENT = "aplus:backend-start";
const END_EVENT = "aplus:backend-end";

export async function backendFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
  try {
    return await fetch(input, init);
  } finally {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(END_EVENT));
  }
}

export const backendActivityEvents = {
  start: START_EVENT,
  end: END_EVENT,
};
