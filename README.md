# Node_Zero

A cyberpunk-themed static website featuring "The Whispering Code" and other interactive content.

## Deployment

This project is configured to deploy to Azure Static Web Apps automatically.

### Azure Static Web Apps Setup

1. **Prerequisites:**
   - Azure subscription
   - GitHub repository (this repo)
   - Azure Static Web Apps resource

2. **Deployment Configuration:**
   - The GitHub workflow is located in `.github/workflows/azure-static-web-apps.yml`
   - The site uses a build process to generate Tailwind CSS
   - Static web app configuration is in `staticwebapp.config.json`

3. **Required GitHub Secret:**
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Deployment token from your Azure Static Web App resource

### Build Process

The site uses Tailwind CSS for styling:

```bash
npm install
npm run build
```

This generates the CSS file at `css/tailwind.generated.css` which is required for the site to display correctly.

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build CSS:
   ```bash
   npm run build
   ```

3. Serve the static files with any local server, e.g.:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### Project Structure

- `index.html` - Main homepage
- `header.html` - Shared header component
- `the-whispering-code/` - Interactive story content
- `css/` - Stylesheets including Tailwind configuration
- `js/` - JavaScript functionality
- `staticwebapp.config.json` - Azure Static Web Apps routing configuration

## License

See `License.md` for details.