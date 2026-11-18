# HR Conclave 2026 release guide

Publish approved event content locally, push the changes to a shared Git repository, then use cPanel to pull and deploy the release. This guide uses a private GitHub repository and a `main` release branch as examples. Substitute your Git host or release branch if GIET uses a different one.

## 1. Replace demo content and review the release

| What to update | Where to update it |
| --- | --- |
| Approved theme, date, venue and event contact | Edit `event.theme`, `event.date`, `event.venue` and `contact` in `assets/js/config.js`. The campus map is separate from the event venue. |
| Speakers and guests | Replace the five demo profiles in `data/demo-content.json`. Keep a unique `id` for each speaker and set the display `order`. Save approved portraits in `assets/images/speakers/` and set each `photo` path with the exact filename and capitalization. |
| Panels and agenda | In the same JSON file, replace the demo panels and arrange the untimed agenda sessions in their approved order. Use speaker IDs in `panelists` so the panel cards display the correct names. |
| Provisional copy and social previews | In `index.html`, update the About note and the introductory text in Speakers, Panels and Agenda as each section is approved. Update the description and Open Graph metadata. Use an absolute HTTPS URL for the Open Graph image once hosting is confirmed. |
| Notices | Edit the `HR_CONCLAVE_NOTICES` Google Sheets tab. The site is already configured for live notices. Disable any test rows and publish approved notices. For same-day sorting by creation time, deploy the current `apps-script/Code.gs` to the existing Apps Script deployment as a new version. |
| 2026 gallery | Leave `galleryEnabled` set to `false` until the gallery photos are approved. Then add photos and alt text as described in [the gallery instructions](README.md#enable-the-gallery-after-the-event). |

Keep pending details marked **To Be Announced** until approved. Review the rendered site, including portraits, text, footer and notices, at desktop and phone widths. Test using the [local preview instructions](README.md#local-preview). The `demo-content.json` filename can stay in place when it contains approved content because `config.contentUrl` points there.

## 2. Confirm cPanel paths and prepare the deployment file

In **cPanel → Domains**, check the document root for the domain serving the event site. Have the hosting administrator approve the site URL and create its dedicated public folder. For example, a document root of `/home/ACCOUNT/public_html` and a URL ending in `/hr-conclave-2026/` would use `/home/ACCOUNT/public_html/hr-conclave-2026`. The cPanel Git checkout belongs outside the document root, for example in `/home/ACCOUNT/repositories/hr-conclave-2026`. [cPanel guide to document roots](https://docs.cpanel.net/knowledge-base/cpanel-product/how-domains-serve-content/)

Create a file named exactly `.cpanel.yml` next to `index.html`. Replace `REPLACE_WITH_APPROVED_ABSOLUTE_PATH` with the public folder you just confirmed. The folder must already exist. The task copies the static website files and stops if the destination is missing or relative.

```yaml
---
deployment:
  tasks:
    - >-
      deploy_path='REPLACE_WITH_APPROVED_ABSOLUTE_PATH' &&
      test "${deploy_path#/}" != "$deploy_path" &&
      test -d "$deploy_path" &&
      /bin/mkdir -p "$deploy_path/assets" &&
      /bin/cp -a index.html components data "$deploy_path/" &&
      /bin/cp -a assets/css assets/js assets/images "$deploy_path/assets/"
```

The checkout holds the site source and Google Apps Script source. The public copy contains only the browser files. The task overwrites matching files in the event folder and leaves old files in place. If a release renames or removes a file that needs to disappear publicly, remove that exact obsolete file from the event folder after verifying the new release. Back up an existing event folder before the first deployment. [cPanel deployment file requirements](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/)

## 3. Push the initial release to Git

Create an empty repository in GIET’s Git account. If using GitHub, use **New repository** and leave GitHub’s README, license and gitignore initialization options off. The current project folder has no Git repository. Once the content and real deployment path are ready, run these commands in PowerShell.

```powershell
Set-Location -LiteralPath 'B:\HR WEBPAGE'
git init -b main
git add -- .cpanel.yml index.html components assets/css assets/js assets/images data apps-script/Code.gs README.md DEPLOYMENT.md
git diff --cached --stat
git commit -m "Prepare HR Conclave 2026 release"
git remote add origin https://github.com/YOUR-ORG/hr-conclave-2026.git
git push -u origin main
```

Use the clone URL of the repository you actually created. Keep passwords, tokens, private SSH keys and private drafts outside the files you stage. The configured public Apps Script `/exec` URL is used by site visitors. The spreadsheet ID belongs in the Apps Script project’s properties.

## 4. Clone and publish from cPanel

1. For a private repository, configure a cPanel SSH key. In GitHub, go to **Settings → Deploy keys → Add deploy key** and paste the **public key**, leaving **Allow write access** unchecked. Use the repository’s SSH clone URL in cPanel, such as `git@github.com:YOUR-ORG/hr-conclave-2026.git`. If a custom SSH key or alias is needed, follow cPanel’s SSH configuration steps. If Git Version Control or the required SSH access is missing, ask the hosting provider to enable it. [cPanel private repository setup](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-access-to-private-repositories/)
2. Open **cPanel → Files → Git Version Control → Create**. Enable **Clone a Repository**, enter the Git clone URL and use the private checkout path chosen in step 2.
3. Click **Manage** on the repository and confirm the checked-out branch is `main`, or the release branch you chose.
4. In **Pull or Deploy**, click **Update from Remote**. Confirm the HEAD commit matches the release on Git. Then click **Deploy HEAD Commit** to copy the files into the public event folder. [cPanel pull deployment steps](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-deployment/#pull-and-deploy-changes-from-the-cpanel-interface)
5. Visit the approved HTTPS URL with a trailing slash in a private browser window. Verify the page, styling, navigation, speaker photos, agenda, footer links, map and live notice bar. If the first deployment fails, check that the target folder exists and that the cPanel account can write to it. A disabled deploy button can indicate a missing or invalid committed `.cpanel.yml`, no checked-out branch or local modifications in cPanel’s checkout. [cPanel Git Version Control](https://docs.cpanel.net/cpanel/files/git-version-control/)

## 5. Publish later updates

For a code, program, speaker or image change, start by running `git pull --ff-only origin main`. Edit and preview the local copy, then stage and push the files you changed. This example updates the program data.

```powershell
git add -- data/demo-content.json
git diff --cached
git commit -m "Update approved conclave program"
git push origin main
```

In cPanel, repeat **Update from Remote → Deploy HEAD Commit**, then verify the live page. Use Git for website edits so the cPanel checkout can fast-forward cleanly.

For a **notice-only change**, edit the Sheet. The live site checks for updates roughly every five minutes, and reloading the page makes a fresh request. For an **Apps Script code change**, update the existing Google deployment to a new version from **Deploy → Manage deployments**. If the same `/exec` URL is retained, the site configuration requires no change. [Apps Script deployment versions](https://developers.google.com/apps-script/concepts/deployments)

If a website release causes a problem, use `git revert` on the problematic commit, push the resulting fix to `main`, then pull and deploy it from cPanel. Verify that any files introduced by the problematic release are also removed from the public folder if required.

