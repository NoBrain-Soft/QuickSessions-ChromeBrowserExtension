# QuickSessions

A Chrome browser extension for managing tab sessions as templates. Save your browsing contexts and restore them instantly.

---

## Features

### 🔖 Template Management
- **Save Current Tabs** - Capture all open tabs with one click
- **Create from Scratch** - Build custom templates manually
- **Edit Templates** - Add, remove, or modify URLs anytime
- **Quick Launch** - Restore any template instantly

### 🚀 Smart Startup Options
Choose what happens when Chrome starts:
- **Show Template Selector** - Pick a template to launch
- **Auto-Launch Default** - Automatically open your favorite template
- **Do Nothing** - Normal Chrome startup

### 🎯 Flexible Opening Modes
- Open templates in a **new window**
- Add tabs to **current window**
- **Replace** existing tabs

### 💾 Data Management
- **Export** templates to JSON file
- **Import** templates from backup
- Templates sync across devices via Chrome Sync

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`) - Save current tabs
- `Ctrl+Shift+Q` (Mac: `Cmd+Shift+Q`) - Open extension

---

## Usage

### Creating Templates

**Method 1: Save Current Tabs**
1. Open the tabs you want to save
2. Click the QuickSessions icon in Chrome toolbar
3. Click "Save Current Tabs"
4. Enter a name and save

**Method 2: Create from Scratch**
1. Click the QuickSessions icon
2. Click "New Template"
3. Enter a name
4. Add URLs manually in the editor

### Launching Templates

**Quick Launch**
1. Click the QuickSessions icon
2. Click the ▶️ button on any template
3. Tabs open according to your settings

**From Startup**
1. Go to Settings (⚙️ icon)
2. Choose "Show template selector" or "Auto-launch default"
3. Templates will appear/launch on browser start

### Managing Templates

**Edit Template**
- Click ✏️ icon to modify name, description, or URLs
- Add/remove individual tabs
- Changes save automatically

**Delete Template**
- Click 🗑️ icon to remove a template
- Confirm deletion (if confirmation is enabled)

**Search & Sort**
- Use search bar to find templates
- Sort by name, date created, last used, or usage count
- Choose ascending or descending order

### Settings

Access settings by clicking the ⚙️ icon in the popup.

**Startup Behavior**
- Configure what happens when Chrome starts
- Set a default template for auto-launch

**Opening Behavior**
- Choose how templates open (new window, current window, or replace tabs)
- Optionally close existing tabs when replacing

**Display Options**
- Set default sort order
- Show/hide favicons
- Enable/disable delete confirmations

**Data Management**
- Export all templates to backup file
- Import templates from previous backups
- View storage usage

---

## Privacy & Security

- **100% Local** - All data stored on your device
- **No Tracking** - Zero analytics or telemetry
- **No External Servers** - No data sent anywhere
- **Chrome Sync** - Optional cross-device sync via your Google account

---

## Compatibility

- **Chrome Version**: 88+ (Manifest V3)
- **Recommended**: Chrome 102 or later
- **Platform**: Windows, Mac, Linux, ChromeOS

---

## Features in Detail

### Template Structure
Each template contains:
- Name and optional description
- List of URLs with titles
- Creation and last-used timestamps
- Usage statistics

### Smart Features
- Automatic favicon fetching
- Usage tracking (helps sort by most-used)
- Invalid URL filtering (won't save chrome:// pages, etc.)
- Cross-device sync via Chrome Sync Storage

### Limitations
- Cannot save incognito tabs (Chrome restriction)
- Cannot open chrome://, about:, or file:// URLs
- Maximum ~500 templates (depends on size)
- Does not save tab state (scroll position, form data, etc.)

---

## Tips

### Organizing Templates
- Use descriptive names: "Work - Morning Routine" vs "Template 1"
- Add descriptions for complex templates
- Delete unused templates to save space

### Startup Templates
- Create a "Daily Start" template with frequently used sites
- Set different templates for work days vs weekends
- Use template selector for flexible startup

### Keyboard Efficiency
- Use `Ctrl+Shift+S` to quickly save current session
- Customize shortcuts at `chrome://extensions/shortcuts`

### Data Safety
- Export templates regularly as backup
- Keep exported JSON files in cloud storage
- Templates in Chrome Sync are backed up automatically

---

## Icon Attribution

Extension icons should be added to the `assets/icons/` folder. Required sizes: 16x16, 32x32, 48x48, 128x128 pixels.

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
- Check your Chrome version (must be 88+)
- Try reloading the extension
- Export your templates before troubleshooting
- Check browser console for errors

---

**QuickSessions** - Switch contexts, stay productive.