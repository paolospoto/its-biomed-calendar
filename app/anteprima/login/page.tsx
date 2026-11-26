import Link from "next/link";
import { Icon } from "@/components/calendar-ui/icons";
import ui from "@/components/calendar-ui/ui.module.css";
import s from "./login.module.css";

export default function PreviewLoginPage() {
  return (
    <div className={s.page}>
      <section className={s.brand}>
        <div className={s.logoBox}>
          <img src="/logo-its.png" alt="ITS Academy Nuove Tecnologie della Vita" />
        </div>
        <div>
          <h1 className={s.claim}>Il tuo calendario delle lezioni, sempre aggiornato.</h1>
          <p className={s.claimSub}>
            Consulta le prossime lezioni, segui l&apos;avanzamento del corso e preparati ai test.
          </p>
        </div>
        <p className={s.footer}>ITS Academy Alessandro Volta · Palermo</p>
      </section>
      <section className={s.formSide}>
        <form className={s.form}>
          <h2 className={s.title}>Accedi</h2>
          <p className={ui.muted}>Usa le credenziali fornite dalla segreteria.</p>
          <div className={ui.field}>
            <label htmlFor="pv-email">Email istituzionale</label>
            <input id="pv-email" type="email" className={ui.input} placeholder="nome@esempio.it" autoComplete="off" />
          </div>
          <div className={ui.field}>
            <label htmlFor="pv-password">Password</label>
            <input id="pv-password" type="password" className={ui.input} autoComplete="off" />
          </div>
          <Link href="/anteprima" className={`${ui.button} ${ui.buttonPrimary} ${s.submit}`}>
            Accedi
          </Link>
          <p className={ui.note}>
            <Icon name="info" />
            <span>
              La registrazione autonoma non è disponibile. Per ottenere l&apos;accesso o reimpostare la password,
              contatta l&apos;amministratore.
            </span>
          </p>
        </form>
      </section>
    </div>
  );
}
