import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BUG-10: BkHdr & MarketScreen Accessibility Regression Tests", () => {
  const appPath = path.resolve(__dirname, "../src/app/App.tsx");
  const appCode = fs.readFileSync(appPath, "utf-8");

  it("should ensure BkHdr back button has accessible label and >=44px tap target", () => {
    expect(appCode).toContain('aria-label="Back"');
    expect(appCode).toContain('w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer');
  });

  it("should ensure MarketScreen unavailable state uses semantic h2 to maintain heading order", () => {
    expect(appCode).toContain('<h2 className="text-base font-bold text-gray-900">');
    expect(appCode).not.toContain('<h3 className="text-base font-bold text-gray-900">');
  });
});
