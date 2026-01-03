# Fetch API Key from Google Secret Manager
Write-Host "Fetching API Key from Google Secret Manager..."

try {
    $secretPayload = gcloud secrets versions access latest --secret="CommunityAI" --project="76940192256"
    
    # Check if we got a value
    if (-not [string]::IsNullOrWhiteSpace($secretPayload)) {
        # Check if .env.local exists, if not create it
        if (-not (Test-Path ".env.local")) {
            New-Item -Path ".env.local" -ItemType File
        }
        
        # specific assumption: the secret is JUST the key string. 
        # If it's a JSON, we might need to parse it. 
        # Assuming just string for now based on typical usage for "API Key".
        
        $envContent = "VITE_FIREBASE_API_KEY=$secretPayload"
        Add-Content -Path ".env.local" -Value $envContent
        
        Write-Host "Successfully added VITE_FIREBASE_API_KEY to .env.local"
    } else {
        Write-Host "Error: Secret was empty." -ForegroundColor Red
    }
} catch {
    Write-Host "Error accessing Secret Manager. Ensure you are logged in with 'gcloud auth login' and have access permissions." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
