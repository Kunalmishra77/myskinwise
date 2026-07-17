import { render } from "@testing-library/react";
import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("escapes < in serialized data so it can't break out of the script tag", () => {
    const { container } = render(<JsonLd data={{ x: "</script><b>hi" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const html = script?.innerHTML ?? "";
    expect(html).toContain("\\u003c");
    expect(html).not.toContain("</script><b>hi");
  });
});
