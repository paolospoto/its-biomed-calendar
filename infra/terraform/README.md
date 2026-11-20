# Infrastruttura Terraform

Ambiente unico che gestisce:

- **Supabase**: progetto e database Postgres.
- **Vercel**: progetto Next.js senza integrazione Git, con le variabili d'ambiente di Supabase già impostate.

## Requisiti

- Terraform >= 1.10
- Token Vercel: <https://vercel.com/account/tokens>
- Token Supabase: <https://supabase.com/dashboard/account/tokens>
- Slug dell'organizzazione Supabase (visibile nell'URL della dashboard)

## Configurazione

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # inserisci chiavi e riferimenti
terraform init
terraform plan
terraform apply
```

`terraform.tfvars` e lo state (`*.tfstate`) sono esclusi da git perché contengono segreti.
Dopo il primo `terraform init` versiona il file `.terraform.lock.hcl`.

## Deploy dell'app

Il progetto Vercel non è collegato al repository, quindi i deploy si fanno con la Vercel CLI:

```bash
export VERCEL_ORG_ID=<team-id-o-user-id>
export VERCEL_PROJECT_ID=$(terraform -chdir=infra/terraform output -raw vercel_project_id)
vercel deploy --prod
```

## Output

| Nome | Descrizione |
| --- | --- |
| `vercel_project_id` | ID del progetto Vercel |
| `supabase_project_ref` | Reference del progetto Supabase |
| `supabase_url` | URL delle API Supabase |
| `supabase_publishable_key` | Publishable key (sensibile: `terraform output -raw supabase_publishable_key`) |
