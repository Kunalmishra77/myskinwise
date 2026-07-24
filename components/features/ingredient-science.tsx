import { Tabs, type TabItem } from "@/components/ui/tabs";

export interface IngredientGroup {
  tabLabel: string;
  items: string[];
}

export interface IngredientScienceProps {
  groups: IngredientGroup[];
  heading?: string;
}

/**
 * Slugifies a tab label into a stable, DOM-safe id (lowercase, spaces and
 * non-alphanumerics collapsed to single hyphens, no leading/trailing
 * hyphens). Used to derive `<Tabs>` tab ids from `group.tabLabel`.
 */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Renders "research-driven ingredients" content (WEBSITE_CONTENT.md §3/§6/§9)
 * as a tabbed list: one tab per concern sub-type/skin-type, each showing its
 * ingredients as a `<ul>`. Thin server-component wrapper around `<Tabs>`
 * (the actual interactive/client piece).
 */
export function IngredientScience({ groups, heading }: IngredientScienceProps) {
  const tabs: TabItem[] = groups.map((group) => ({
    id: slugify(group.tabLabel),
    label: group.tabLabel,
    content: (
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink-soft">
        {group.items.map((item, index) => (
          <li key={`${group.tabLabel}-${index}`}>{item}</li>
        ))}
      </ul>
    ),
  }));

  return (
    <div>
      {heading && (
        <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">{heading}</h2>
      )}
      <Tabs tabs={tabs} />
    </div>
  );
}
