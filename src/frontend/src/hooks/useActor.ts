// Compatibility shim: wraps @caffeineai/core-infrastructure's useActor
// with the project-specific createActor from backend.ts so callers
// can continue using `useActor()` with no arguments.
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

export function useActor() {
  return _useActor(createActor);
}
