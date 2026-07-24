import { Suspense } from "react";
import { LoginForm } from "@/app/admin/login/login-form";

// useSearchParams (in LoginForm, to read ?next=) forces a client bailout
// during prerender unless it sits under a Suspense boundary. The page shell
// stays static; only the form suspends.
export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
