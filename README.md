# Moysidis Mobile Massage - Studio Manager

A fully accessible web application for managing Moysidis Mobile Massage studio operations, including client management, appointment scheduling, and service catalog management.

## Features

### ♿ Accessibility First
- **WCAG 2.1 AA Compliant** - Meets rigorous accessibility standards
- **Screen Reader Support** - Full ARIA labels and live regions
- **Keyboard Navigation** - Complete functionality without mouse
- **Skip Links** - Quick navigation to main content
- **Focus Management** - Proper focus trapping in modals
- **High Contrast Support** - Works with Windows High Contrast Mode
- **Reduced Motion** - Respects user preferences for animations
- **Semantic HTML** - Proper heading hierarchy and landmarks

### Client Management
- Add, edit, view, and delete clients
- Store contact information (phone, email)
- Add clinical notes (allergies, preferences, medical conditions)
- Search clients by name, phone, or email
- Automatic cleanup of appointments when deleting clients

### Appointment Scheduling
- Schedule appointments with date and time
- Link appointments to clients and services
- View appointments in a filtered list
- Date range filtering
- Edit and cancel appointments
- Visual appointment cards with all details

### Service Management
- Create service catalog with names, durations, and prices
- Add detailed descriptions
- Set customizable durations (15-minute increments)
- Flexible pricing
- Edit and delete services with appointment cleanup

### Dashboard & Analytics
- **Real-time Statistics**
  - Total client count
  - Today's appointments
  - Weekly revenue
  - Active services count
- **Upcoming Appointments** - View next 7 days at a glance

### Data Management
- **Local Storage** - All data persists in browser
- **Auto-save** - Changes saved automatically
- **Cascading Deletes** - Related data cleaned up properly

## Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dimitrismi1995/Massage-Studio-Manager.git
cd Massage-Studio-Manager
```

2. Open `index.html` in your web browser:
```bash
# On Windows
start index.html

# On Mac
open index.html

# On Linux
xdg-open index.html
```

That's it! No build process, dependencies, or server required.

## Usage Guide

### Adding Your First Client

1. Navigate to the **Clients** section using the navigation menu
2. Click the **"+ Add Client"** button
3. Fill in the required fields (Name and Phone)
4. Optionally add email and notes
5. Click **"Save Client"**

### Scheduling an Appointment

1. Navigate to the **Appointments** section
2. Click **"+ Schedule Appointment"**
3. Select a client from the dropdown
4. Choose a service
5. Set the date and time
6. Add any notes
7. Click **"Schedule Appointment"**

### Creating Services

1. Navigate to the **Services** section
2. Click **"+ Add Service"**
3. Enter service name, duration (minutes), and price
4. Optionally add a description
5. Click **"Save Service"**

### Searching Clients

Use the search bar on the Clients page to quickly find clients by:
- Name
- Phone number
- Email address

### Filtering Appointments

Use the date picker on the Appointments page to:
- View appointments for a specific date
- Click "Clear Filter" to see all appointments

## Keyboard Shortcuts

- **Tab** - Navigate through elements
- **Enter/Space** - Activate buttons and links
- **Escape** - Close modals
- **Arrow Keys** - Navigate within dropdowns and lists

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser supporting ES6 and localStorage

## Accessibility Features

### Screen Reader Testing
The application has been tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### Supported Accessibility Features
- Semantic HTML5 elements
- ARIA landmarks and roles
- ARIA live regions for dynamic content
- Proper heading hierarchy (h1-h4)
- Form labels and descriptions
- Error announcements
- Focus indicators (3px visible outline)
- Color contrast ratio 4.5:1 minimum
- Touch target size minimum 44x44px

## Data Storage

All data is stored locally in your browser using `localStorage`. This means:
- ✓ Data persists between sessions
- ✓ No internet connection required
- ✓ Privacy - data never leaves your device
- ⚠ Data is browser-specific
- ⚠ Clearing browser data will remove studio data

**Note:** Data is not synced between browsers or devices.

## File Structure

```
Massage-Studio-Manager/
├── index.html       # Main HTML structure
├── styles.css       # Accessible styling
├── app.js          # Application logic
└── README.md       # Documentation
```

## Technical Details

### Technologies Used
- **Vanilla JavaScript** - No frameworks or libraries
- **CSS Variables** - For consistent theming
- **LocalStorage API** - For data persistence
- **ES6+ Features** - Classes, arrow functions, template literals

### Code Architecture
- **DataStore Class** - Handles all data operations
- **UIController Class** - Manages UI interactions and rendering
- **Separation of Concerns** - Data logic separate from UI logic

## Branding

This application features the **Moysidis Mobile Massage** brand identity with custom logo and styling.

## Customization

### Changing Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2563eb;    /* Main brand color */
    --success-color: #059669;    /* Success messages */
    --danger-color: #dc2626;     /* Delete/cancel actions */
    --warning-color: #d97706;    /* Warnings */
}
```

### Modifying Time Slots
Edit the service duration input in `index.html`:
```html
<input 
    type="number" 
    id="service-duration" 
    min="15"
    step="15"
    required
>
```

## Troubleshooting

### Data Not Persisting
- Ensure browser allows localStorage for the site
- Check if browser is in private/incognito mode
- Verify sufficient storage space

### Display Issues
- Clear browser cache
- Ensure JavaScript is enabled
- Check browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test accessibility with screen readers
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please visit:
https://github.com/dimitrismi1995/Massage-Studio-Manager/issues

## Acknowledgments

- Built with accessibility as a core principle
- Tested with multiple screen readers
- Designed for real-world massage studio workflows
- Branding by Moysidis Mobile Massage

---

**Version:** 1.0.0  
**Last Updated:** 2026  
**Accessibility Level:** WCAG 2.1 AA