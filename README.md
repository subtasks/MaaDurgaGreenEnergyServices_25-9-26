# EnaSolar Quote Hub

Build a mobile-responsive, full-stack B2B Solar Quotation Management System named "EnaSolar Quotation Manager" (SQ) with dynamic pricing calculations, Bill of Materials (BOM) management, and PDF proposal generation. Also, gve a tagline image in heading. . So, there is a login authentication system to submit quotation, check and view all quotations. Admin have seperate panel to view all quotations and do the required.

### 1. Branding & UI Design System

- **Color Palette:** Clean slate light background (#F8FAFC), dark primary text (#0F172A), vibrant teal/cyan primary action buttons (#0091D5 or #0D9488), emerald green highlight buttons (#059669), and dark navy container cards for totals (#0F172A).

- **Typography:** Modern clean sans-serif (Inter or Plus Jakarta Sans).

- **UI Components:** Rounded corners (rounded-xl), subtle card borders, shadow-sm, and high contrast for mobile readabilty.

### 2. Navigation & Layout

- Top Header: Square avatar logo with initials "SQ", App Title "Quotation Manager", and a hamburger navigation menu on the right.

- Footer: Version indicator ("v1.2.0") at the bottom right.

### 3. Key Pages & Features

#### A. Dashboard Overview Page

- **Welcome Card:** Personalized greeting (e.g., "Welcome back, Gautam Kumar"), displaying access scope.

- **Metric Cards (4 Grid/Stacked Cards):**

  - Total Quotations (Count, e.g., 368)

  - This Month (Count, e.g., 33)

  - Total Quote Value (Formatted currency in INR, e.g., ₹28,92,82,273.40)

  - Organizations (Count, e.g., 2)

- **Quick Actions:** Buttons to "Create Solar Quote", "View Quotations", and "Change Password".

- **Organizations Card:** List saved entities with CIN and GST numbers (e.g., "Maa Durga Green Energy Services
 | CIN: ... | GST: ...").

- **Recent Quotations:** Scrollable card list showing Quote ID (e.g., Q-20260909-0606), Customer Name, Issue Date, Amount, and a "View All" link.

#### B. Quotation Registry Page

- Top section with badge counter ("368 TOTAL") and a primary button "+ New Quotation".

- List of quotation cards containing:

  - Unique Quote ID (e.g., Q-20260909-0606)

  - Customer Name & Organization Name

  - Quotation Subject line (e.g., "Quotation for On Grid Solar System - 3 kW")

  - System capacity & Type tag (e.g., "3.00 kW | On Grid")

  - Quick action buttons: **View**, **Edit**, **Download PDF** (Blue), and **Archive** (Light Red).

#### C. Create / Edit Solar Quotation Form

Organize into collapsible or distinct card sections:

1. **Quotation Profile:**

   - Dropdown: Select Organization

   - Date pickers: Issue Date (defaults to today) & Valid Until (auto-calculated to 30 days, max 3 months)

   - Input: Quotation Subject (e.g., "Quotation for On Grid Solar System")

2. **Customer Profile:**

   - Dropdown: Customer Type (Individual / Organization)

   - Inputs: Customer CIN (Optional), Customer GST (Optional), Customer Name, Contact Number, CA Number (Optional), Customer Email.

   - Address fields: Billing Address (Textarea) + Checkbox "Shipping same as billing" + Shipping Address.

3. **Solar Configuration:**

   - Button: "Refresh BOM & Pricing"

   - Dropdowns: Category/Purpose (Commercial / Residential / Industrial), System Type (On Grid / Off Grid / Hybrid), Tier/Type (Standard / Premium), DCR / Non-DCR.

   - Inputs: Plant Capacity (KW), Solar Module Make (e.g., Waaree), Inverter Make (e.g., Luminous).

4. **Pricing Summary & Dynamic Calculation:**

   - Editable pricing rows table with horizontally scrollable columns: Component (System, Balance of System), Capacity (KW), Base Price, Discount, Row GST Rates, Net Amount.

   - Button: "+ Add Pricing Row".

5. **Amount Summary Box (Dark Navy Card):**

   - Live calculated breakdown:

     - 1. Total Solar Components Amount

     - Taxable Amount calculation

     - Split GST breakdowns: CGST @ 2.5%, CGST @ 9%, SGST @ 2.5%, SGST @ 9% (or dynamic GST based on system rules).

     - 2. Add-ons (BOM + Custom) & GST on Add-ons @ 18%.

     - **Final Total** (Highlighted in bold green).

6. **Bill of Materials (BOM) Table:**

   - Pre-filled table based on chosen configuration with horizontal scroll.

   - Columns: Sl no., Material Name, Specifications/Material Type (Solar module, Inverter, Module mounting structure, AC cable, DC cable, ACDB, DCDB, Solar meter, Net meter, Earthing, Lugs, Cable ties, etc.).

   - Controls: Dropdown & Button to "+ Add Item".

7. **Custom Add-ons & Quotation Preferences:**

   - Optional custom items table (Item, Description, Amount).

   - Checkbox: "Show QR code on PDF" (for verification block in generated PDF).

   - Textarea: Terms & Conditions (pre-populated with default scope of work, validity, warranty, and exclusions).

   - Textarea: Additional Notes.

   - Bottom Action Buttons: **Create Quotation** (Primary teal) and **Cancel** (Outline).

### 4. Technical Requirements

- Automatic unique Quote ID generation (Format: `Q-YYYYMMDD-XXXX`).

- State management for dynamic tax and pricing updates in real-time.

- Print/PDF export utility mapping all selected BOM rows, totals, and customer details into a clean PDF format.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://solar-configurator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eaceeffc-2954-425a-b3ca-f7f7f7e7a9e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
