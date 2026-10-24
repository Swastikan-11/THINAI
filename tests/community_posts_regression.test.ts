import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-07 - CommunityScreen Fabricated Sample Posts Pruned", () => {
  const commSource = fs.readFileSync("src/app/components/CommunityScreen.tsx", "utf8");

  it("should not contain fake sample posts with Demo Reference Only or Sample Farmer", () => {
    expect(commSource).not.toContain("sample-post-1");
    expect(commSource).not.toContain("Sample Farmer / மாதிரி விவசாயி");
    expect(commSource).not.toContain("Demo Reference Only");
  });

  it("should initialize community posts with an empty array rather than fake defaults", () => {
    expect(commSource).toContain("useState<CommunityPost[]>([])");
  });
});
