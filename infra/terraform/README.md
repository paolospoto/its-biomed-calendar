# Terraform infrastructure

Single environment that manages:

- **Supabase**: project and Postgres database.
- **Supabase Auth**: email/password authentication without self sign-up, site URL and allowed redirect URLs pointing to the Vercel app.
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

## Supabase Auth

Auth is included in the Supabase Free plan (up to 50,000 monthly active users).
Self sign-up is disabled: users are created by an admin from the Supabase dashboard or with `auth.admin.createUser`.

Password recovery needs a custom SMTP server, set through `auth_smtp`. Without it, Supabase only delivers emails to members of the organization team, with a low hourly limit.

Auth settings live in `auth.tf` and can be tuned through the `auth_*` variables and `app_url`.

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
| `app_url` | Production URL used by Supabase Auth |
| `supabase_publishable_key` | Publishable key (sensitive: `terraform output -raw supabase_publishable_key`) |
