"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main>
      <h1>Accedi</h1>
      <form action={action}>
        <p><input name="email" type="email" placeholder="Email" required autoComplete="username" /></p>
        <p><input name="password" type="password" placeholder="Password" required autoComplete="current-password" /></p>
        <button disabled={pending}>Entra</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
