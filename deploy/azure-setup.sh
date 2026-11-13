#!/usr/bin/env bash
# One-time Azure setup for northwind-commerce. Run it in Azure Cloud Shell (Bash):
#
#   git clone https://github.com/ShravanJanwade/northwind-commerce.git
#   bash northwind-commerce/deploy/azure-setup.sh
#
# What it does, all inside the existing rg-portfolio resource group:
#   - four storage accounts with static website hosting: staging and production
#     in West US 2, production in Canada Central and France Central;
#   - lets the existing GitHub deploy identity (id-portfolio-github) sign in from
#     this repository's four deployment environments, with OpenID Connect;
#   - stores the account names and site addresses as repository variables
#     (with `gh` signed in), then starts the first deploy.
#
# Static websites have no compute: each account holds well under a megabyte, so
# the four together cost a few cents a month at most. Safe to run again.
set -euo pipefail

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nerror: %s\n' "$*" >&2; exit 1; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="${REPO:-$(git -C "$HERE" remote get-url origin 2>/dev/null | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-portfolio}"
IDENTITY="${IDENTITY:-id-portfolio-github}"
[[ "$REPO" =~ ^[^/]+/[^/]+$ ]] || die "Could not tell which GitHub repository this is. Run with REPO=owner/name."

say "Checking the Azure subscription"
az account show --output none 2>/dev/null || die "Not signed in. Run: az login"
subscription_name="$(az account show --query name --output tsv)"
echo "Subscription: $subscription_name"
if [[ "$subscription_name" != "Azure for Students" && -z "${ALLOW_ANY_SUBSCRIPTION:-}" ]]; then
  die "This is not the Azure for Students subscription. Run: az account set --subscription \"Azure for Students\" (or set ALLOW_ANY_SUBSCRIPTION=1)."
fi
subscription_id="$(az account show --query id --output tsv)"
tenant_id="$(az account show --query tenantId --output tsv)"

az group show --name "$RESOURCE_GROUP" --output none 2>/dev/null ||
  die "Resource group $RESOURCE_GROUP not found. It is created by the CodeLens or FluxDB setup script."
client_id="$(az identity show --name "$IDENTITY" --resource-group "$RESOURCE_GROUP" --query clientId --output tsv 2>/dev/null)" ||
  die "Managed identity $IDENTITY not found in $RESOURCE_GROUP. It is created by the CodeLens or FluxDB setup script."

# Policies in some tenants require tags on every resource; reuse the group's.
mapfile -t tags < <(az group show --name "$RESOURCE_GROUP" --query tags --output json |
  python3 -c 'import json,sys; [print(f"{k}={v}") for k, v in (json.load(sys.stdin) or {}).items()]')
tag_args=()
if ((${#tags[@]})); then tag_args=(--tags "${tags[@]}"); fi

say "Creating the storefront storage accounts"
suffix="$(printf '%s' "$subscription_id" | sha1sum | cut -c1-6)"
declare -A LOCATION=([staging]=westus2 [us]=westus2 [ca]=canadacentral [eu]=francecentral)
declare -A ACCOUNT URL
for target in staging us ca eu; do
  account="nwc${target}${suffix}"
  ACCOUNT[$target]="$account"
  if az storage account show --name "$account" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
    echo "$account already exists"
  else
    echo "Creating $account in ${LOCATION[$target]}"
    az storage account create --name "$account" --resource-group "$RESOURCE_GROUP" \
      --location "${LOCATION[$target]}" --sku Standard_LRS --kind StorageV2 \
      --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false \
      ${tag_args[@]+"${tag_args[@]}"} --output none
  fi
  az storage blob service-properties update --account-name "$account" --auth-mode key \
    --static-website --index-document index.html --404-document 404.html --output none
  URL[$target]="$(az storage account show --name "$account" --resource-group "$RESOURCE_GROUP" \
    --query primaryEndpoints.web --output tsv)"
  echo "  ${URL[$target]}"
done

say "Trusting $REPO's deployment environments"
for environment in staging production-us production-ca production-eu; do
  name="northwind-${environment}"
  if az identity federated-credential show --identity-name "$IDENTITY" --resource-group "$RESOURCE_GROUP" \
    --name "$name" --output none 2>/dev/null; then
    echo "$name already trusted"
  else
    # One at a time: Azure rejects concurrent changes to an identity's credentials.
    az identity federated-credential create --identity-name "$IDENTITY" --resource-group "$RESOURCE_GROUP" \
      --name "$name" --issuer https://token.actions.githubusercontent.com \
      --subject "repo:${REPO}:environment:${environment}" --audiences api://AzureADTokenExchange --output none
    echo "$name trusted"
  fi
done

declare -A VARIABLES=(
  [AZURE_CLIENT_ID]="$client_id"
  [AZURE_TENANT_ID]="$tenant_id"
  [AZURE_SUBSCRIPTION_ID]="$subscription_id"
  [STORAGE_STAGING]="${ACCOUNT[staging]}"
  [STORAGE_US]="${ACCOUNT[us]}"
  [STORAGE_CA]="${ACCOUNT[ca]}"
  [STORAGE_EU]="${ACCOUNT[eu]}"
  [SITE_URL_STAGING]="${URL[staging]}"
  [SITE_URL_US]="${URL[us]}"
  [SITE_URL_CA]="${URL[ca]}"
  [SITE_URL_EU]="${URL[eu]}"
)

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  say "Setting repository variables on $REPO"
  for key in "${!VARIABLES[@]}"; do gh variable set "$key" --repo "$REPO" --body "${VARIABLES[$key]}"; done
  say "Starting the first deploy"
  gh workflow run deploy.yml --repo "$REPO" && echo "Watch it with: gh run watch --repo $REPO"
else
  say "Add these under Settings > Secrets and variables > Actions > Variables on $REPO"
  for key in "${!VARIABLES[@]}"; do printf '  %-22s %s\n' "$key" "${VARIABLES[$key]}"; done
  echo
  echo "Then run the Deploy workflow from the Actions tab. (Or run 'gh auth login' and this script again.)"
fi

say "Done. Production storefronts:"
printf '  US  %s\n  CA  %s\n  EU  %s\n' "${URL[us]}" "${URL[ca]}" "${URL[eu]}"
