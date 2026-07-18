import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Please enter at least 10 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;

// TODO(subproject-B): replace stub with real Server Action (Supabase insert)
export async function submitContactStub(
  data: ContactInput,
): Promise<{ success: true }> {
  await new Promise((r) => setTimeout(r, 300));
  return { success: true };
}
