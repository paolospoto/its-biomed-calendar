# Terraform infrastructure

Single environment that manages:

- **Supabase**: project and Postgres database.
- **Vercel**: Next.js project without Git integration, with the Supabase environment variables already set.

## Requirements

- Terraform >= 1.10
- Vercel token: <https://vercel.com/account/tokens>
- Supabase token: <https://supabase.com/dashboard/account/tokens>
- Supabase organization slug (visible in the dashboard URL)

## Setup

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in keys and account references
terraform init
terraform plan
terraform apply
```

`terraform.tfvars` and the state (`*.tfstate`) are git-ignored because they contain secrets.
After the first `terraform init`, commit the `.terraform.lock.hcl` file.

## App deployment

The Vercel project is not linked to the repository, so deployments are done with the Vercel CLI:

```bash
export VERCEL_ORG_ID=<team-id-or-user-id>
export VERCEL_PROJECT_ID=$(terraform -chdir=infra/terraform output -raw vercel_project_id)
vercel deploy --prod
```

## Outputs

| Name | Description |
| --- | --- |
| `vercel_project_id` | Vercel project ID |
| `supabase_project_ref` | Supabase project reference |
| `supabase_url` | Supabase API URL |
| `supabase_publishable_key` | Publishable key (sensitive: `terraform output -raw supabase_publishable_key`) |
