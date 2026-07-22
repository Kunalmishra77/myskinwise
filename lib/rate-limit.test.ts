import { MemoryRateLimiter, clientKey } from "@/lib/rate-limit";

it("allows up to the limit then blocks", async () => {
  const limiter = new MemoryRateLimiter(3, 60_000);
  for (let i = 0; i < 3; i++) {
    expect((await limiter.check("ip-a")).allowed, `request ${i + 1}`).toBe(true);
  }
  const blocked = await limiter.check("ip-a");
  expect(blocked.allowed).toBe(false);
  expect(blocked.retryAfter).toBeGreaterThan(0);
});

it("keys separately per caller, so one abuser cannot block everyone", async () => {
  const limiter = new MemoryRateLimiter(1, 60_000);
  expect((await limiter.check("ip-a")).allowed).toBe(true);
  expect((await limiter.check("ip-a")).allowed).toBe(false);
  expect((await limiter.check("ip-b")).allowed).toBe(true);
});

it("lets a caller through again once the window has passed", async () => {
  const limiter = new MemoryRateLimiter(1, 20);
  expect((await limiter.check("ip-c")).allowed).toBe(true);
  expect((await limiter.check("ip-c")).allowed).toBe(false);
  await new Promise((r) => setTimeout(r, 40));
  expect((await limiter.check("ip-c")).allowed).toBe(true);
});

it("takes the first hop of x-forwarded-for", () => {
  const request = new Request("https://x.test", {
    headers: { "x-forwarded-for": "203.0.113.9, 70.41.3.18" },
  });
  expect(clientKey(request)).toBe("203.0.113.9");
});

it("falls back to a stable key when no IP header is present", () => {
  expect(clientKey(new Request("https://x.test"))).toBe("unknown");
});
