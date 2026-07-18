"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { contactSchema, submitContactStub, type ContactInput } from "@/lib/validation/contact";

const fieldClasses =
  "w-full rounded-lg border border-ink/20 bg-white px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Contact form: RHF + Zod validation, stubbed submit (no backend yet).
 * A mailto: fallback link keeps the page functional pre-backend.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = async (data: ContactInput) => {
    await submitContactStub(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-ink/10 bg-ink/5 p-6 text-center">
        <p className="font-medium text-ink">Thanks — we&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="contact-name" className="text-sm font-medium text-ink">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          className={fieldClasses}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="contact-name-error" role="alert" className="text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          className={fieldClasses}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="contact-email-error" role="alert" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact-message" className="text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          className={fieldClasses}
          aria-invalid={errors.message ? "true" : "false"}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p id="contact-message-error" role="alert" className="text-sm text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>

      <p className="text-center text-sm text-ink/60">
        Prefer email?{" "}
        <a href={`mailto:${SITE.email}`} className="underline hover:text-ink">
          Email us directly
        </a>
      </p>
    </form>
  );
}
