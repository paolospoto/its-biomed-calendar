import { uploadCalendar } from "./actions";

export default function ImportPage() {
  return (
    <>
      <h1>Importa calendario</h1>
      <form action={uploadCalendar}>
        <input name="pdf" type="file" accept="application/pdf" required />
        <button>Carica</button>
      </form>
    </>
  );
}
