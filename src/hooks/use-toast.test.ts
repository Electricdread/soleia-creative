import { beforeEach, describe, expect, it, vi } from "vitest";

const { message, error, dismiss } = vi.hoisted(() => ({
  message: vi.fn((..._args: unknown[]) => 1 as string | number),
  error: vi.fn((..._args: unknown[]) => 2 as string | number),
  dismiss: vi.fn((..._args: unknown[]) => undefined),
}));

vi.mock("sonner", () => ({ toast: Object.assign(message, { error, dismiss }) }));

import { toast, useToast } from "./use-toast";

describe("use-toast now routes to Sonner", () => {
  beforeEach(() => {
    message.mockClear();
    error.mockClear();
    dismiss.mockClear();
  });

  it("shows a default toast as a neutral Sonner message", () => {
    toast({ title: "Saved", description: "All changes stored" });
    expect(message).toHaveBeenCalledWith("Saved", expect.objectContaining({ description: "All changes stored" }));
    expect(error).not.toHaveBeenCalled();
  });

  it("shows the destructive variant as a Sonner error", () => {
    toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    expect(error).toHaveBeenCalledWith("Login failed", expect.objectContaining({ description: "Invalid credentials" }));
    expect(message).not.toHaveBeenCalled();
  });

  it("uses the description as the message when there is no title", () => {
    toast({ description: "Only a body" });
    expect(message).toHaveBeenCalledWith("Only a body", expect.objectContaining({ description: undefined }));
  });

  it("passes a custom duration through", () => {
    toast({ title: "Quick", duration: 1500 });
    expect(message).toHaveBeenCalledWith("Quick", expect.objectContaining({ duration: 1500 }));
  });

  it("updates and dismisses the same toast by id", () => {
    const t = toast({ title: "Working" });
    expect(t.id).toBe(1);

    t.update({ title: "Done" });
    expect(message).toHaveBeenLastCalledWith("Done", expect.objectContaining({ id: 1 }));

    t.dismiss();
    expect(dismiss).toHaveBeenCalledWith(1);
  });

  it("returns one stable object from useToast so it is safe in dependency arrays", () => {
    expect(useToast()).toBe(useToast());
    expect(useToast().toast).toBe(toast);
  });
});
