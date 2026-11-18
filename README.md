# HR Conclave 2026

Standalone event site for Gandhi Institute of Excellent Technocrats (GIET), Ghangapatna. The public site uses HTML, CSS and vanilla JavaScript. It starts with local demo notices and a provisional 2026 program. The optional live notice feed reads from Google Sheets through a Google Apps Script web app.

## Project structure

```text
HR WEBPAGE/
├── index.html                    Page sections and rendering templates
├── components/
│   ├── header.html
│   ├── footer.html
│   └── notices.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── config.js
│   │   ├── components.js
│   │   ├── main.js
│   │   └── notices.js
│   ├── images/
│   │   ├── branding/
│   │   ├── hero/
│   │   ├── speakers/             Reserved for approved portraits
│   │   └── gallery/              Reserved for post-event photographs
│   └── [original supplied image files]
├── data/
│   └── demo-content.json
├── apps-script/
│   └── Code.gs
└── README.md
```

## Local preview

Serve the workspace through a static HTTP server so that module scripts, components and JSON can load. If Python 3 is already installed, run the following from the workspace. Python is only a local preview option. There is no build step or server runtime dependency.

```powershell
py -3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/). On systems that expose Python as `python3`, use `python3` in place of `py -3`. An existing local IIS site with Static Content enabled can also serve the workspace using the IIS steps below.

## Updating the site

- Edit `assets/js/config.js` for the event title, year, theme, date, venue, organizer, organizer contact, branding, hero image, campus details, Google Maps embed and link, and past editions. When renaming the event, update the matching title and social metadata in `index.html` for crawlers.
- Edit `data/demo-content.json` for speakers, panels, agenda sessions, gallery items and demo notices. Speaker IDs must be unique. The number in `order` controls card order. Use speaker IDs in a panel’s `panelists` array. Leave optional panel times and moderators blank until confirmed. Arrange agenda entries in the order they should appear in the horizontal program.
- The speaker and agenda rows advance automatically when visible, then return to the first card. Each row has a pause control and respects the visitor’s reduced-motion setting. Footer social destinations are configured in `config.links`.
- Update the About text and the provisional labels in `index.html` when the program has been approved. Preserve source verification for historical content.
- Save approved logos and photos in the matching `assets/images/` directory and update their paths in configuration or data. Use site-relative paths such as `assets/images/speakers/name.jpg`, including from inside component fragments. Supply meaningful alternative text for archive and gallery photographs.
- Add previous editions to the archive in display order. The photograph for the 2025 retrospective is configured separately in `highlightsPhoto`.

## Reference and asset verification

The [official 2025 event page](https://www.gietbbsr.edu.in/page/hr-conclave-2025) organizes the event around its speakers, themed discussions and photographs. The 2026 site uses the supplied institutional marks, a retrospective from the three published panel themes, and an archive card that leads back to the source. Historical photo URLs sampled from the official gallery were inaccessible during the reference check. The supplied photograph has visible HR Conclave 2025 signage and is used locally for the hero, retrospective and archive.

| Supplied filename | Website use |
| --- | --- |
| `1. GIET LOGO.png` | Left, institutional mark |
| `2. HR LOGO.png` | Left, conclave mark |
| `3. NAAC LOGO.png` | Right, desktop |
| `4. nba.png` | Right, desktop |
| `5. DSIR Recognized SIRO Seal.png` | Right, desktop |
| `6. GIET TEXT LOGO.png` | Footer, left |
| `HERO BG IAMEGS.jpg` | 1439 × 681 supplied group photograph |

The browser loads smaller copies of the supplied PNGs, resized proportionally with transparency preserved. Original files are in the top-level `assets/` directory. The hero JPEG is copied at its supplied resolution and cropped in CSS. No required supplied branding file is missing. The footer embeds the supplied GIET campus map and provides a separate Maps link based on the published campus address. The institutional telephone and social links come from the official 2025 page. Event-specific contact and venue remain pending.

## Google Sheets notice setup

1. In your GIET Google account, create a blank Google Sheet. Under **File → Settings**, choose the India time zone corresponding to `Asia/Kolkata`.
2. Rename the worksheet tab exactly `HR_CONCLAVE_NOTICES`.
3. Paste this tab-separated row into cell A1.

   ```text
   Notice_ID	Title	Description	Category	Priority	Publish_Date	Expiry_Date	Link	Status	Created_At
   ```

4. Set column A to **Format → Number → Plain text**. Set columns F and G to a custom date format of `yyyy-mm-dd`, or use **Plain text** and enter exactly `YYYY-MM-DD`. Set J to **Plain text** and enter the local creation timestamp as `YYYY-MM-DDTHH:mm:ss`, for example `2026-01-01T10:30:00`. Date-only creation entries are accepted and sort as midnight. Use four-digit years and zero-padded fields. Enter dates as calendar dates in India Standard Time. A notice appears starting on its publish date and through the end of its expiry date. An empty expiry means it remains eligible until disabled.
5. Paste these sample rows into A2. Change the dates if needed so one is due today or earlier, one is in the future and one has already expired. Include only text and links approved for publication.

   ```text
   DEMO-01	2026 event details are to be announced	The theme, date and venue will be published after confirmation.	Event update	High	2026-01-01			Active	2026-01-01
   DEMO-02	Visit the 2025 event page	See the previous edition’s panel topics and photographs.	Archive	Normal	2026-01-01		https://www.gietbbsr.edu.in/page/hr-conclave-2025	Active	2026-01-01
   DEMO-03	Future sample	This row is for testing the publish date filter.	Test	High	2099-01-01			Active	2026-01-01
   DEMO-04	Expired sample	This row is for testing the expiry filter.	Test	High	2026-01-01	2026-01-02		Active	2026-01-01
   DEMO-05	Disabled sample	This row is for testing the status filter.	Test	High	2026-01-01			Inactive	2026-01-01
   ```

6. In **Data → Data validation**, add dropdowns for E2:E with `High`, `Normal`, `Low`, and for I2:I with `Active`, `Inactive`. Use a unique text ID per row. Fill classifications and dates before publishing. The feed orders eligible notices by newest publish date, then newest creation time. Priority breaks ties. The collapsed bar cycles through eligible titles in that order every 4.5 seconds and loops back to the first. Links are optional and accept public HTTP or HTTPS URLs.

## Google Apps Script deployment

1. From the spreadsheet, open **Extensions → Apps Script**. Replace the starter code in `Code.gs` with the complete local `apps-script/Code.gs` and save.
2. Locate the spreadsheet ID in its URL between `/d/` and `/edit`. In Apps Script, open **Project Settings → Script properties**, add property `SPREADSHEET_ID`, and set its value to that ID. Set the script project timezone to India Standard Time as well. The code uses `Asia/Kolkata` explicitly for notice dates.
3. In the editor, select `checkNoticeSetup` from the function menu and click **Run**. Use Google’s authorization screen, select the GIET account and grant the requested spreadsheet access. Check the execution log for the number of public notices. An error here identifies a setup issue before deployment.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and choose the access option that permits **Anyone** to use it anonymously, including signed-out visitors. Availability depends on the Workspace administrator’s policy. The spreadsheet can remain private. Only the validated notice fields appear in the public response. Click **Deploy** and complete authorization if prompted. [Google web app deployment](https://developers.google.com/apps-script/guides/web)
5. Copy the web app URL ending in `/exec`. Open it in a private browser window while signed out to verify that it returns JSON and only eligible rows. Here is the expected response shape.

   ```json
   {
     "ok": true,
     "notices": [
       {
         "id": "DEMO-01",
         "title": "2026 event details are to be announced",
         "description": "The theme, date and venue will be published after confirmation.",
         "category": "Event update",
         "priority": "High",
         "publishDate": "2026-01-01",
         "expiryDate": null,
         "link": null
       }
     ]
   }
   ```

   An empty feed returns `{"ok":true,"notices":[]}`. Setup or service errors return `{"ok":false,"notices":[],"error":"Notices are temporarily unavailable."}`.
6. In `assets/js/config.js`, set `notices.mode` to `'live'` and `notices.apiUrl` to the copied `/exec` URL. Reload the site over HTTP locally and test again from the IIS origin once approved. Verify the latest title in the collapsed bar, sort order in the panel and filtering for inactive, future and expired rows.
7. To add a notice, append a row with a new ID. To update it, edit the existing row. Set an expiry date or change Status to `Inactive` to remove it. A page refresh picks up the edit immediately if the feed is reachable, and an open tab checks roughly every five minutes. Sheet edits take effect without redeploying the script. For script changes, use **Deploy → Manage deployments** and publish a new version to the same deployment.

### When direct browser access is blocked

Google’s Content Service redirects responses. Verifying the URL in a private window checks anonymous access, while testing from the site origin also checks cross-origin browser access. In the browser’s Network panel, inspect the full request including redirects for login responses or CORS errors. [Google Content Service redirects](https://developers.google.com/apps-script/guides/content#redirects)

If anonymous access works but browser cross-origin requests fail, save the approved response as `data/notices.json` on the same static site. For example, run the following from a trusted administration computer with access to the deployment and inspect the file before publication.

```powershell
curl.exe --fail --location "YOUR_EXEC_URL" --output notices.json
```

If anonymous deployment is unavailable, an authorized editor can prepare the file using the response shape above and eligible, approved sheet rows. Copy the approved JSON to `data/notices.json`, set `notices.mode` to `'live'` and `notices.apiUrl` to `'data/notices.json'`. Replace the published snapshot each time the sheet changes. The browser still filters future and expired entries by date. Check that the file contains JSON with `ok: true` before publishing it.

## Enable the gallery after the event

1. Save approved optimized photos to `assets/images/gallery/`. Optionally prepare smaller thumbnails.
2. Add objects like this to the `gallery` array in `data/demo-content.json`. Each entry needs `src` and `alt`. The `caption` and `thumbnail` fields are optional.

   ```json
   {
     "src": "assets/images/gallery/approved-photo.jpg",
     "thumbnail": "assets/images/gallery/approved-photo-small.jpg",
     "alt": "Describe the people and activity visible in the photo",
     "caption": "Approved caption"
   }
   ```

3. Set `galleryEnabled: true` in `assets/js/config.js`. The section and link appear when at least one valid entry is present. Verify the photo opens, arrow keys move between photos, Escape closes the lightbox and focus returns to the photo button.

## cPanel deployment

See the [release guide](DEPLOYMENT.md) for replacing demo content, setting up Git and deploying updates through cPanel.

## IIS deployment

1. After GIET approves a destination, use an IIS site with the Static Content role service enabled. Create the approved directory or a virtual directory under the existing site and grant the site's serving identity read permission. The proposed URL is `https://www.gietbbsr.edu.in/hr-conclave-2026/`.
2. Copy `index.html`, `components/`, `assets/css/`, `assets/js/`, `assets/images/` and `data/` into that directory, keeping their layout. Keep `apps-script/`, `README.md` and the original master image files in the source workspace.
3. Under **Default Document**, ensure `index.html` is enabled. In **MIME Types**, verify `.json` is served as `application/json` and `.js` has a JavaScript MIME type. Add a mapping only if it is missing and the server configuration allows it. A 404.3 response typically points to a missing MIME mapping or static content configuration. [IIS static content mappings](https://learn.microsoft.com/en-us/iis/configuration/system.webServer/staticContent/mimeMap)
4. Open the published directory URL with its trailing slash and test in a signed-out browser. Confirm the CSS, JavaScript, fragments, images and JSON return successful responses at the subdirectory path. Verify deep links, the mobile menu, keyboard and pointer notice controls, empty and unavailable feed behavior, footer links and hidden gallery. If using a content security policy, permit the configured feed and its redirect or use the same-origin snapshot. Inter is optional and the layout falls back to system fonts.

## Local verification

The site was served over HTTP from a subdirectory and checked in Chromium at 1440, 768, 390 and 320 CSS pixels. Checks covered asset loading, section navigation and deep links, mobile menu, reduced motion, notice hover, click-to-pin, keyboard focus and touch interaction. With temporary sample data, the gallery opened and supported arrow keys, Escape and focus restoration. A simulated live feed covered concurrent-request suppression, previous data retention, invalid responses, safe text rendering and empty results. Apps Script filtering, sorting and response handling were checked with mock spreadsheet data.

## Pending approvals and verification

- Approve the 2026 theme, date, venue, organizer contact and email.
- Supply approved speaker names, roles, biographies and portraits, plus the final panel and agenda details.
- Review the retrospective assets and verify the campus map on the production site.
- The live notice feed has loaded in local preview. Verify it from the production site and update the Apps Script deployment for same-day chronological sorting.
- Confirm the Git remote, cPanel document root and public event URL. Add an absolute Open Graph image and page URL when the public URL is known.
- Add approved post-event gallery images when available.

